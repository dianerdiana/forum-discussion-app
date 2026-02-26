import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

import type { AppDispatch } from '@/redux/store';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

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
  const { getThreads, getThread, handleUpVoteThread } = mod;

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

  describe('getThread', () => {
    it('should call api.get and upsert the detail thread on fulfilled (and clear error)', async () => {
      const threadId = 't-1';

      const detailThread = {
        id: threadId,
        title: 'Thread Detail',
        body: 'Body',
        category: 'general',
        createdAt: '2026-02-26T10:00:00.000Z',
        ownerId: 'u-1',
        upVotesBy: [],
        downVotesBy: [],
        // intentionally omit totalComments to test reducer bridging via comments length
        comments: [
          {
            id: 'c-1',
            content: 'Comment 1',
            createdAt: '2026-02-26T10:01:00.000Z',
            owner: { id: 'u-2', name: 'User 2', email: 'u2@example.com', avatar: '' },
            upVotesBy: [],
            downVotesBy: [],
          },
          {
            id: 'c-2',
            content: 'Comment 2',
            createdAt: '2026-02-26T10:02:00.000Z',
            owner: { id: 'u-3', name: 'User 3', email: 'u3@example.com', avatar: '' },
            upVotesBy: [],
            downVotesBy: [],
          },
        ],
      };

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { detailThread } },
      });

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getThread({ threadId }));

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith(`/threads/${threadId}`);

      expect(result.type).toBe(getThread.fulfilled.type);

      const state = store.getState().threads;

      expect(state.detailStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.selectedId).toBe(threadId);
      expect(state.error).toBeNull(); // you said all fulfilled now clear error

      const stored = state.entities[threadId] as any;
      expect(stored).toBeTruthy();
      expect(stored.title).toBe('Thread Detail');

      // reducer bridge: totalComments derived from comments length when missing
      expect(stored.totalComments).toBe(2);
    });

    it('should call api.get and store rejectWithValue(toApiError) payload on rejected', async () => {
      const threadId = 't-404';

      const rawAxiosError = new Error('Not Found');
      (api.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(rawAxiosError);

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getThread({ threadId }));

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith(`/threads/${threadId}`);

      expect(result.type).toBe(getThread.rejected.type);
      expect(result.payload).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });

      const state = store.getState().threads;
      expect(state.detailStatus).toBe(FETCH_STATUS.failed);
      expect(state.error).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });
    });

    it('should skip api.get when detailStatus is loading (condition in-flight)', async () => {
      const baseState = threadsReducer(undefined, { type: '@@INIT' });

      const preloadedThreadsState = {
        ...baseState,
        detailStatus: FETCH_STATUS.loading,
      };

      const store = createStore(preloadedThreadsState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getThread({ threadId: 't-1' }));

      expect(api.get).not.toHaveBeenCalled();

      // condition=false -> rejected result with meta.condition=true
      expect(result.type).toBe(getThread.rejected.type);
      expect((result as any).meta?.condition).toBe(true);

      const state = store.getState().threads;
      expect(state.detailStatus).toBe(FETCH_STATUS.loading);
    });

    it('should skip api.get when the thread already has comments array (condition cache)', async () => {
      const baseState = threadsReducer(undefined, { type: '@@INIT' });

      const threadId = 't-1';

      const preloadedThreadsState = {
        ...baseState,
        ids: [threadId],
        entities: {
          [threadId]: {
            id: threadId,
            title: 'Cached Detail',
            body: 'Body',
            category: 'general',
            createdAt: '2026-02-25T10:00:00.000Z',
            ownerId: 'u-1',
            upVotesBy: [],
            downVotesBy: [],
            totalComments: 1,
            comments: [
              {
                id: 'c-1',
                content: 'Cached comment',
                createdAt: '2026-02-25T10:01:00.000Z',
                owner: { id: 'u-2', name: 'User 2', email: 'u2@example.com', avatar: '' },
                upVotesBy: [],
                downVotesBy: [],
              },
            ],
          },
        },
        detailStatus: FETCH_STATUS.succeeded,
        error: null,
      };

      const store = createStore(preloadedThreadsState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getThread({ threadId }));

      expect(api.get).not.toHaveBeenCalled();

      expect(result.type).toBe(getThread.rejected.type);
      expect((result as any).meta?.condition).toBe(true);

      const state = store.getState().threads;
      expect(state.entities[threadId]?.title).toBe('Cached Detail');
      expect(state.error).toBeNull();
    });

    it('should call api.get when the thread exists but comments is not an array (condition should fetch detail)', async () => {
      const baseState = threadsReducer(undefined, { type: '@@INIT' });

      const threadId = 't-1';

      const preloadedThreadsState = {
        ...baseState,
        ids: [threadId],
        entities: {
          [threadId]: {
            id: threadId,
            title: 'List Item Only',
            body: 'Body',
            category: 'general',
            createdAt: '2026-02-25T10:00:00.000Z',
            ownerId: 'u-1',
            upVotesBy: [],
            downVotesBy: [],
            totalComments: 0,
            // comments missing -> not an array -> should fetch
          },
        },
        detailStatus: FETCH_STATUS.idle,
        error: null,
      };

      const detailThread = {
        ...preloadedThreadsState.entities[threadId],
        title: 'Fetched Detail',
        comments: [],
        totalComments: 0,
      };

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { detailThread } },
      });

      const store = createStore(preloadedThreadsState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getThread({ threadId }));

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith(`/threads/${threadId}`);
      expect(result.type).toBe(getThread.fulfilled.type);

      const state = store.getState().threads;
      expect(state.entities[threadId]?.title).toBe('Fetched Detail');
      expect(state.error).toBeNull();
    });

    it('should bypass cache and call api.get when force=true', async () => {
      const baseState = threadsReducer(undefined, { type: '@@INIT' });

      const threadId = 't-1';

      const preloadedThreadsState = {
        ...baseState,
        ids: [threadId],
        entities: {
          [threadId]: {
            id: threadId,
            title: 'Cached Detail',
            body: 'Body',
            category: 'general',
            createdAt: '2026-02-25T10:00:00.000Z',
            ownerId: 'u-1',
            upVotesBy: [],
            downVotesBy: [],
            totalComments: 0,
            comments: [],
          },
        },
        detailStatus: FETCH_STATUS.succeeded,
        error: { message: 'previous error' },
      };

      const detailThread = {
        ...preloadedThreadsState.entities[threadId],
        title: 'Forced Refresh Detail',
      };

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { detailThread } },
      });

      const store = createStore(preloadedThreadsState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getThread({ threadId, force: true }));

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith(`/threads/${threadId}`);
      expect(result.type).toBe(getThread.fulfilled.type);

      const state = store.getState().threads;
      expect(state.entities[threadId]?.title).toBe('Forced Refresh Detail');
      expect(state.error).toBeNull(); // fulfilled clears error
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
