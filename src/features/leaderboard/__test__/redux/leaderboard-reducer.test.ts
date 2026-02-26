import { describe, expect, it, vi } from 'vitest';

import { FETCH_STATUS } from '@/utils/constants/fetch-status';

import reducer, { clearLeaderboardError, getLeaderboards } from '../../redux/leaderboard-slice';

vi.mock('@/configs/api-config', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/configs/auth/jwt-service', async () => ({
  toApiError: (e: unknown) => e,
}));

function makeLeaderboard(overrides: Partial<any> = {}) {
  return {
    user: {
      id: 'u-1',
      name: 'User 1',
      email: 'user1@example.com',
      avatar: 'https://example.com/avatar.png',
    },
    score: 10,
    ...overrides,
  };
}

function getInitialState() {
  return reducer(undefined, { type: '@@INIT' });
}

describe('leaderboards slice - reducer', () => {
  it('should return the initial state', () => {
    const initialState = getInitialState();

    expect(initialState.items).toEqual([]);
    expect(initialState.listStatus).toBe(FETCH_STATUS.idle);
    expect(initialState.error).toBeNull();
  });

  describe('reducers', () => {
    it('clearLeaderboardError should set error to null', () => {
      const initialState = getInitialState();

      const stateWithError = {
        ...initialState,
        error: { message: 'previous error' },
      };

      const nextState = reducer(stateWithError, clearLeaderboardError());

      expect(nextState.error).toBeNull();
      expect(nextState.items).toEqual(stateWithError.items);
      expect(nextState.listStatus).toBe(stateWithError.listStatus);
    });
  });

  describe('extraReducers (getLeaderboards)', () => {
    describe('pending', () => {
      it('should set listStatus to loading and clear error', () => {
        const initialState = getInitialState();

        const stateWithError = {
          ...initialState,
          error: { message: 'previous error' },
        };

        const nextState = reducer(stateWithError, { type: getLeaderboards.pending.type });

        expect(nextState.listStatus).toBe(FETCH_STATUS.loading);
        expect(nextState.error).toBeNull();
      });

      it('should not modify items', () => {
        const seededState = {
          ...getInitialState(),
          items: [makeLeaderboard({ score: 99 })],
        };

        const nextState = reducer(seededState, { type: getLeaderboards.pending.type });

        expect(nextState.items).toEqual(seededState.items);
      });
    });

    describe('fulfilled', () => {
      it('should set listStatus to succeeded, replace items, and clear error', () => {
        const initialState = getInitialState();

        const stateWithError = {
          ...initialState,
          error: { message: 'previous error' },
        };

        const payload = [
          makeLeaderboard({
            user: { id: 'u-1', name: 'Alice', email: 'alice@example.com', avatar: '' },
            score: 50,
          }),
          makeLeaderboard({
            user: { id: 'u-2', name: 'Bob', email: 'bob@example.com', avatar: '' },
            score: 40,
          }),
        ];

        const nextState = reducer(stateWithError, {
          type: getLeaderboards.fulfilled.type,
          payload,
        });

        expect(nextState.listStatus).toBe(FETCH_STATUS.succeeded);
        expect(nextState.items).toEqual(payload);
        expect(nextState.error).toBeNull(); // <-- updated assertion
      });
    });

    describe('rejected', () => {
      it('should set listStatus to failed and set error from payload', () => {
        const initialState = getInitialState();

        const mockError = { message: 'Unauthorized', status: 401 };

        const nextState = reducer(initialState, {
          type: getLeaderboards.rejected.type,
          payload: mockError,
        });

        expect(nextState.listStatus).toBe(FETCH_STATUS.failed);
        expect(nextState.error).toEqual(mockError);
      });

      it('should not modify items', () => {
        const seededState = {
          ...getInitialState(),
          items: [makeLeaderboard({ score: 123 })],
        };

        const nextState = reducer(seededState, {
          type: getLeaderboards.rejected.type,
          payload: { message: 'Server error' },
        });

        expect(nextState.items).toEqual(seededState.items);
        expect(nextState.listStatus).toBe(FETCH_STATUS.failed);
      });
    });
  });
});
