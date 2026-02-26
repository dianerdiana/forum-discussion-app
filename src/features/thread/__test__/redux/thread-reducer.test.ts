import { describe, expect, it, vi } from 'vitest';

import { FETCH_STATUS } from '@/utils/constants/fetch-status';

import reducer, { createThread, getThread, getThreads } from '../../redux/thread-slice';

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
    comments: [],
    ...overrides,
  };
}

function makeComment(overrides: Partial<any> = {}) {
  return {
    id: 'c-1',
    content: 'Comment',
    createdAt: '2026-02-25T10:10:00.000Z',
    owner: { id: 'u-2', name: 'User 2', email: 'u2@example.com', avatar: '' },
    upVotesBy: [],
    downVotesBy: [],
    ...overrides,
  };
}

function getInitialState() {
  return reducer(undefined, { type: '@@INIT' });
}

function seedThreads(state: any, threads: any[]) {
  return reducer(state, { type: getThreads.fulfilled.type, payload: threads });
}

function seedThread(state: any, thread: any) {
  return reducer(state, { type: getThreads.fulfilled.type, payload: [thread] });
}

describe('threads slice - reducer (getThreads extraReducers)', () => {
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

describe('threads slice - reducer (getThread extraReducers)', () => {
  describe('getThread.pending', () => {
    it('should set detailStatus to loading and clear error', () => {
      const initialState = getInitialState();

      const stateWithError = {
        ...initialState,
        error: { message: 'previous error' },
      };

      const nextState = reducer(stateWithError, { type: getThread.pending.type });

      expect(nextState.detailStatus).toBe(FETCH_STATUS.loading);
      expect(nextState.error).toBeNull();
    });
  });

  describe('getThread.fulfilled', () => {
    it('should set detailStatus to succeeded, upsert thread, and set selectedId', () => {
      const initialState = getInitialState();

      const incoming = makeThread({
        id: 't-1',
        title: 'Detail Title',
        comments: [makeComment({ id: 'c-1' }), makeComment({ id: 'c-2' }), makeComment({ id: 'c-3' })],
        // totalComments intentionally omitted to test bridge logic
        totalComments: undefined,
      });

      const nextState = reducer(initialState, {
        type: getThread.fulfilled.type,
        payload: incoming,
      });

      expect(nextState.detailStatus).toBe(FETCH_STATUS.succeeded);
      expect(nextState.selectedId).toBe('t-1');

      const stored = nextState.entities['t-1'] as any;
      expect(stored).toBeTruthy();
      expect(stored.title).toBe('Detail Title');

      // bridge: totalComments derived from incoming.comments.length when totalComments is missing
      expect(stored.totalComments).toBe(3);
    });

    it('should preserve existing totalComments when incoming has no totalComments and no comments array', () => {
      const initialState = getInitialState();

      const existing = makeThread({
        id: 't-1',
        title: 'List Title',
        totalComments: 2,
        comments: [makeComment({ id: 'c-1' }), makeComment({ id: 'c-2' })],
      });

      const seeded = seedThread(initialState, existing);

      const incoming = makeThread({
        id: 't-1',
        title: 'Detail Title',
        // simulate payload that does not include comments and totalComments
        comments: undefined,
        totalComments: undefined,
      });

      const nextState = reducer(seeded, {
        type: getThread.fulfilled.type,
        payload: incoming,
      });

      const stored = nextState.entities['t-1'] as any;

      // merged: keeps existing.totalComments because incoming has neither totalComments nor comments[]
      expect(stored.totalComments).toBe(2);

      // merged: preserves existing comments because incoming.comments is undefined
      expect(stored.comments).toEqual(existing.comments);

      expect(nextState.detailStatus).toBe(FETCH_STATUS.succeeded);
      expect(nextState.selectedId).toBe('t-1');
    });

    it('should prefer incoming.totalComments when provided (even if comments array exists)', () => {
      const initialState = getInitialState();

      const incoming = makeThread({
        id: 't-1',
        totalComments: 99,
        comments: [makeComment({ id: 'c-1' }), makeComment({ id: 'c-2' })],
      });

      const nextState = reducer(initialState, {
        type: getThread.fulfilled.type,
        payload: incoming,
      });

      const stored = nextState.entities['t-1'] as any;
      expect(stored.totalComments).toBe(99);
    });
  });

  describe('getThread.rejected', () => {
    it('should set detailStatus to failed and set error from action.payload when provided', () => {
      const initialState = getInitialState();

      const mockError = { message: 'Not found', status: 404 };

      const nextState = reducer(initialState, {
        type: getThread.rejected.type,
        payload: mockError,
      });

      expect(nextState.detailStatus).toBe(FETCH_STATUS.failed);
      expect(nextState.error).toEqual(mockError);
    });
  });
});

describe('threads slice - reducer (createThread extraReducers)', () => {
  describe('createThread.pending', () => {
    it('should set createThreadStatus to loading and clear error', () => {
      const initialState = getInitialState();

      const stateWithError = {
        ...initialState,
        error: { message: 'previous error' },
      };

      const nextState = reducer(stateWithError, { type: createThread.pending.type });

      expect(nextState.createThreadStatus).toBe(FETCH_STATUS.loading);
      expect(nextState.error).toBeNull();
    });
  });

  describe('createThread.fulfilled', () => {
    it('should set createThreadStatus to succeeded, add the new thread, and set selectedId', () => {
      const initialState = getInitialState();

      const newThread = makeThread({
        id: 't-new',
        title: 'New Thread',
        createdAt: '2026-02-26T10:00:00.000Z',
      });

      const nextState = reducer(initialState, {
        type: createThread.fulfilled.type,
        payload: {
          message: 'ok',
          status: 'success',
          data: { thread: newThread },
        },
      });

      expect(nextState.createThreadStatus).toBe(FETCH_STATUS.succeeded);
      expect(nextState.selectedId).toBe('t-new');

      expect(nextState.entities['t-new']).toEqual(newThread);
      expect(nextState.ids).toContain('t-new');
    });

    it('should respect adapter sorting (newer createdAt should come first)', () => {
      const initialState = getInitialState();

      const older = makeThread({ id: 't-old', createdAt: '2026-02-24T10:00:00.000Z' });
      const seededState = reducer(initialState, {
        type: createThread.fulfilled.type,
        payload: {
          message: 'ok',
          status: 'success',
          data: { thread: older },
        },
      });

      const newer = makeThread({ id: 't-new', createdAt: '2026-02-26T10:00:00.000Z' });
      const nextState = reducer(seededState, {
        type: createThread.fulfilled.type,
        payload: {
          message: 'ok',
          status: 'success',
          data: { thread: newer },
        },
      });

      expect(nextState.ids[0]).toBe('t-new');
      expect(nextState.ids[1]).toBe('t-old');
    });
  });

  describe('createThread.rejected', () => {
    it('should set createThreadStatus to failed and set error from action.payload when provided', () => {
      const initialState = getInitialState();

      const mockError = { message: 'Validation error', status: 400 };

      const nextState = reducer(initialState, {
        type: createThread.rejected.type,
        payload: mockError,
      });

      expect(nextState.createThreadStatus).toBe(FETCH_STATUS.failed);
      expect(nextState.error).toEqual(mockError);
    });
  });
});
