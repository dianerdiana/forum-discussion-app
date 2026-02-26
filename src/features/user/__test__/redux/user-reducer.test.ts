import { describe, expect, it, vi } from 'vitest';

import { FETCH_STATUS } from '@/utils/constants/fetch-status';

import reducer, { getOwnProfile, getUsers } from '../../redux/user-slice';

// 1) Mock api-config (required because reducer calls api.removeToken() on getOwnProfile.rejected)
vi.mock('@/configs/api-config', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    removeToken: vi.fn(),
  },
}));

// 2) Mock jwt-service helper (slice imports toApiError in thunks)
vi.mock('@/configs/auth/jwt-service', () => ({
  toApiError: (e: unknown) => ({
    message: 'Mocked API Error',
    original: e,
  }),
}));

type AnyState = ReturnType<typeof reducer>;

function makeUser(overrides: Partial<{ id: string; name: string; email: string; avatar: string }> = {}) {
  return {
    id: 'u-1',
    name: 'User 1',
    email: 'user1@example.com',
    avatar: 'https://example.com/avatar.png',
    ...overrides,
  };
}

function getInitialState(): AnyState {
  return reducer(undefined, { type: '@@INIT' });
}

describe('users slice - reducer', () => {
  it('should return the initial state', () => {
    const initialState = getInitialState();

    expect(initialState.ids).toEqual([]);
    expect(initialState.entities).toEqual({});

    expect(initialState.selectedId).toBeNull();
    expect(initialState.me).toBeNull();

    expect(initialState.preloadStatus).toBe(FETCH_STATUS.idle);
    expect(initialState.listStatus).toBe(FETCH_STATUS.idle);

    expect(initialState.error).toBeNull();
  });

  describe('extraReducers (getUsers)', () => {
    it('getUsers.pending should set listStatus to loading and clear error', () => {
      const initialState = getInitialState();

      const stateWithError: AnyState = {
        ...initialState,
        error: { message: 'previous error' },
      };

      const nextState = reducer(stateWithError, { type: getUsers.pending.type });

      expect(nextState.listStatus).toBe(FETCH_STATUS.loading);
      expect(nextState.error).toBeNull();

      // adapter data should not change on pending
      expect(nextState.ids).toEqual(stateWithError.ids);
      expect(nextState.entities).toEqual(stateWithError.entities);
    });

    it('getUsers.fulfilled should set listStatus to succeeded, clear error, and set users (adapter setAll)', () => {
      const initialState = getInitialState();

      const stateWithError: AnyState = {
        ...initialState,
        error: { message: 'previous error' },
        listStatus: FETCH_STATUS.loading,
      };

      const payload = [
        makeUser({ id: 'u-1', name: 'Alice', email: 'alice@example.com', avatar: '' }),
        makeUser({ id: 'u-2', name: 'Bob', email: 'bob@example.com', avatar: '' }),
      ];

      const nextState = reducer(stateWithError, {
        type: getUsers.fulfilled.type,
        payload,
      });

      expect(nextState.listStatus).toBe(FETCH_STATUS.succeeded);
      expect(nextState.error).toBeNull();

      expect(nextState.ids).toEqual(['u-1', 'u-2']);
      expect(nextState.entities['u-1']).toEqual(payload[0]);
      expect(nextState.entities['u-2']).toEqual(payload[1]);
    });

    it('getUsers.rejected should set listStatus to failed and set error from action.payload when provided', () => {
      const initialState = getInitialState();

      const mockError = { message: 'Unauthorized', status: 401 };

      const nextState = reducer(initialState, {
        type: getUsers.rejected.type,
        payload: mockError,
      });

      expect(nextState.listStatus).toBe(FETCH_STATUS.failed);
      expect(nextState.error).toEqual(mockError);
    });
  });

  describe('extraReducers (getOwnProfile)', () => {
    it('getOwnProfile.pending should set preloadStatus to loading and clear error', () => {
      const initialState = getInitialState();

      const stateWithError: AnyState = {
        ...initialState,
        error: { message: 'previous error' },
      };

      const nextState = reducer(stateWithError, { type: getOwnProfile.pending.type });

      expect(nextState.preloadStatus).toBe(FETCH_STATUS.loading);
      expect(nextState.error).toBeNull();

      // should not touch list status or adapter data
      expect(nextState.listStatus).toBe(stateWithError.listStatus);
      expect(nextState.ids).toEqual(stateWithError.ids);
      expect(nextState.entities).toEqual(stateWithError.entities);
    });

    it('getOwnProfile.fulfilled should set preloadStatus to succeeded, clear error, and set me', async () => {
      const initialState = getInitialState();

      const stateWithError: AnyState = {
        ...initialState,
        error: { message: 'previous error' },
        preloadStatus: FETCH_STATUS.loading,
      };

      const payload = makeUser({ id: 'u-me', name: 'Me', email: 'me@example.com' });

      const nextState = reducer(stateWithError, {
        type: getOwnProfile.fulfilled.type,
        payload,
      });

      expect(nextState.preloadStatus).toBe(FETCH_STATUS.succeeded);
      expect(nextState.error).toBeNull();
      expect(nextState.me).toEqual(payload);
    });

    it('getOwnProfile.rejected should set preloadStatus to failed, set error, and call api.removeToken()', async () => {
      const { api } = await import('@/configs/api-config');

      const initialState = getInitialState();
      const mockError = { message: 'Token expired' };

      const nextState = reducer(initialState, {
        type: getOwnProfile.rejected.type,
        payload: mockError,
      });

      expect(nextState.preloadStatus).toBe(FETCH_STATUS.failed);
      expect(nextState.error).toEqual(mockError);

      expect(api.removeToken).toHaveBeenCalledTimes(1);
    });
  });
});
