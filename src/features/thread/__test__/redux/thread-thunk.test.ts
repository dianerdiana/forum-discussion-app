import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

import type { AppDispatch } from '@/redux/store';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

import { handleUpVoteThread } from '../../redux/thread-slice';

// 1) Mock api-config: control api calls
vi.mock('@/configs/api-config', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// 2) Mock jwt-service helper (slice uses toApiError)
vi.mock('@/configs/auth/jwt-service', () => ({
  toApiError: (e: unknown) => ({
    message: 'Mocked API Error',
    original: e,
  }),
}));

describe('threads thunks', async () => {
  const mod = await import('../../redux/thread-slice');
  const threadsReducer = mod.default;
  const { getThreads } = mod;

  const { api } = await import('@/configs/api-config');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createStore(preloadedThreadsState?: any) {
    return configureStore({
      reducer: { threads: threadsReducer },
      preloadedState: preloadedThreadsState ? { threads: preloadedThreadsState } : undefined,
    });
  }

  describe('getThreads', () => {
    it('should call api.get and populate adapter state on fulfilled', async () => {
      const threadList = [
        {
          id: 't-1',
          title: 'Thread 1',
          body: 'Body 1',
          category: 'general',
          createdAt: '2026-02-25T10:00:00.000Z',
          ownerId: 'u-1',
          upVotesBy: [],
          downVotesBy: [],
          totalComments: 0,
        },
        {
          id: 't-2',
          title: 'Thread 2',
          body: 'Body 2',
          category: 'tech',
          createdAt: '2026-02-25T11:00:00.000Z', // newer -> should come first due to sortComparer
          ownerId: 'u-2',
          upVotesBy: ['u-9'],
          downVotesBy: [],
          totalComments: 3,
        },
      ];

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { threads: threadList } },
      });

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getThreads());

      // API call
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/threads');

      // Thunk result
      expect(result.type).toBe(getThreads.fulfilled.type);

      // State updated
      const state = store.getState().threads;

      expect(state.listStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.error).toBeNull();

      // sorted by createdAt desc: t-2 then t-1
      expect(state.ids).toEqual(['t-2', 't-1']);
      expect(state.entities['t-2']?.totalComments).toBe(3);
    });

    it('should call api.get and store the rejectWithValue(toApiError) payload on rejected', async () => {
      const rawAxiosError = new Error('Network Error');
      (api.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(rawAxiosError);

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getThreads());

      // API call
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/threads');

      // Thunk result
      expect(result.type).toBe(getThreads.rejected.type);

      // If thunk uses rejectWithValue, payload should be the rejectValue
      expect(result.payload).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });

      // State updated
      const state = store.getState().threads;

      expect(state.listStatus).toBe(FETCH_STATUS.failed);
      expect(state.error).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });
    });
  });

  describe('handleUpVoteThread', () => {
    it('should call api.post and update votes on the thread entity on fulfilled', async () => {
      const baseState = threadsReducer(undefined, { type: '@@INIT' });

      const threadId = 't-1';
      const userId = 'u-1';

      const preloadedThreadsState = {
        ...baseState,
        ids: [threadId],
        entities: {
          [threadId]: {
            id: threadId,
            title: 'Thread 1',
            body: 'Body',
            category: 'general',
            createdAt: '2026-02-25T10:00:00.000Z',
            ownerId: 'owner-1',
            upVotesBy: [],
            downVotesBy: [userId], // ensure it gets removed when switching to upvote
            totalComments: 0,
          },
        },
      };

      // API response shape expected by your reducer:
      // fulfilled reducer reads action.payload.data.vote.userId
      (api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          message: 'ok',
          status: 'success',
          data: {
            vote: {
              id: 'v-1',
              threadId,
              userId,
              voteType: 1,
            },
          },
        },
      });

      const store = createStore(preloadedThreadsState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(handleUpVoteThread({ threadId, userId }));

      // API call
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith(`/threads/${threadId}/up-vote`);

      // Thunk result
      expect(result.type).toBe(handleUpVoteThread.fulfilled.type);

      // State updated
      const state = store.getState().threads;
      const thread = state.entities[threadId];

      expect(state.upVoteThreadStatus).toBe(FETCH_STATUS.succeeded);
      expect(thread).toBeTruthy();

      expect(thread.downVotesBy).not.toContain(userId);
      expect(thread.upVotesBy).toContain(userId);

      // Optional: ensure in-flight flag cleared
      expect(state.voteInFlightByThreadId[threadId]).toBeNull();
    });
  });
});
