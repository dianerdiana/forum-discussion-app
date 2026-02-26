import { describe, expect, it, vi } from 'vitest';

import { FETCH_STATUS } from '@/utils/constants/fetch-status';

import reducer, { getThreads } from '../../redux/thread-slice';

vi.mock('@/configs/api-config', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/configs/auth/jwt-service', async () => ({
  // Only mock what the slice needs at import-time
  toApiError: (e: unknown) => e,
}));

function makeThread(overrides: Partial<any> = {}) {
  return {
    id: 't-1',
    title: 'Thread 1',
    body: 'Body',
    category: 'general',
    createdAt: '2026-02-25T10:00:00.000Z',
    ownerId: 'u-1',
    upVotesBy: [],
    downVotesBy: [],
    totalComments: 0,
    ...overrides,
  };
}

function getInitialState() {
  return reducer(undefined, { type: '@@INIT' });
}

function seedThreads(state: any, threads: any[]) {
  return reducer(state, { type: getThreads.fulfilled.type, payload: threads });
}

describe('threads slice - reducer (extraReducers)', () => {
  describe('getThreads.pending', () => {
    it('should set listStatus to loading and clear error', () => {
      const initialState = getInitialState();

      const stateWithError = {
        ...initialState,
        error: { message: 'previous error' },
      };

      const nextState = reducer(stateWithError, { type: getThreads.pending.type });

      expect(nextState.listStatus).toBe(FETCH_STATUS.loading);
      expect(nextState.error).toBeNull();
    });

    it('should not change adapter data (ids/entities) nor selectedId', () => {
      const initialState = getInitialState();

      const seededState = seedThreads(initialState, [
        makeThread({
          id: 't-1',
          createdAt: new Date().toISOString(),
        }),
      ]);

      const stateWithSelected = reducer(seededState, {
        type: 'threads/setSelectedThread',
        payload: 't-1',
      });

      const nextState = reducer(stateWithSelected, { type: getThreads.pending.type });

      expect(nextState.ids).toEqual(stateWithSelected.ids);
      expect(nextState.entities).toEqual(stateWithSelected.entities);
      expect(nextState.selectedId).toBe('t-1');
    });
  });

  describe('getThreads.fulfilled', () => {
    it('should set listStatus to succeeded and clear error', () => {
      const initialState = getInitialState();

      const stateWithError = {
        ...initialState,
        error: { message: 'previous error' },
      };

      const payloadThreads = [
        makeThread({
          id: 't-1',
          body: 'Body 1',
          createdAt: '2026-02-25T10:00:00.000Z',
        }),
      ];

      const nextState = reducer(stateWithError, {
        type: getThreads.fulfilled.type,
        payload: payloadThreads,
      });

      expect(nextState.listStatus).toBe(FETCH_STATUS.succeeded);
      expect(nextState.error).toBeNull();
    });

    it('should populate adapter state from payload and keep selectedId unchanged', () => {
      const initialState = getInitialState();

      const seededState = {
        ...initialState,
        selectedId: 't-selected',
      };

      const payloadThreads = [
        makeThread({
          id: 't-1',
          title: 'Thread 1',
          body: 'Body 1',
          category: 'general',
          createdAt: '2026-02-25T10:00:00.000Z',
          ownerId: 'u-1',
          upVotesBy: [],
          downVotesBy: [],
          totalComments: 0,
        }),
        makeThread({
          id: 't-2',
          title: 'Thread 2',
          body: 'Body 2',
          category: 'tech',
          createdAt: '2026-02-25T11:00:00.000Z',
          ownerId: 'u-2',
          upVotesBy: ['u-9'],
          downVotesBy: [],
          totalComments: 3,
        }),
      ];

      const nextState = reducer(seededState, {
        type: getThreads.fulfilled.type,
        payload: payloadThreads,
      });

      // Adapter assertions
      // NOTE: ordering depends on your entityAdapter sortComparer.
      // Keeping your original expectation.
      expect(nextState.ids).toEqual(['t-2', 't-1']);
      expect(nextState.entities['t-1']?.title).toBe('Thread 1');
      expect(nextState.entities['t-2']?.category).toBe('tech');
      expect(nextState.entities['t-2']?.totalComments).toBe(3);

      // Non-adapter field should remain unchanged
      expect(nextState.selectedId).toBe('t-selected');
    });
  });

  describe('getThreads.rejected', () => {
    it('should set listStatus to failed and set error from action.payload', () => {
      const initialState = getInitialState();

      const mockError = {
        message: 'Unauthorized',
        status: 401,
      };

      const nextState = reducer(initialState, {
        type: getThreads.rejected.type,
        payload: mockError, // typically from rejectWithValue
      });

      expect(nextState.listStatus).toBe(FETCH_STATUS.failed);
      expect(nextState.error).toEqual(mockError);
    });

    it('should not change adapter data (ids/entities remain the same)', () => {
      const initialState = getInitialState();

      const seededState = seedThreads(initialState, [
        makeThread({
          id: 't-1',
          title: 'Thread 1',
          body: 'Body',
        }),
      ]);

      const idsBefore = seededState.ids;
      const entitiesBefore = seededState.entities;

      const nextState = reducer(seededState, {
        type: getThreads.rejected.type,
        payload: { message: 'Server error' },
      });

      expect(nextState.ids).toEqual(idsBefore);
      expect(nextState.entities).toEqual(entitiesBefore);
      expect(nextState.listStatus).toBe(FETCH_STATUS.failed);
    });
  });
});
