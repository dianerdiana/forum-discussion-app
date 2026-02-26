import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

import type { AppDispatch } from '@/redux/store';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

// 1) Mock api-config: control api calls (including removeToken used in reducer)
vi.mock('@/configs/api-config', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    removeToken: vi.fn(),
  },
}));

// 2) Mock jwt-service helper (slice uses toApiError)
vi.mock('@/configs/auth/jwt-service', () => ({
  toApiError: (e: unknown) => ({
    message: 'Mocked API Error',
    original: e,
  }),
}));

describe('users thunks', async () => {
  const mod = await import('../../redux/user-slice');
  const usersReducer = mod.default;
  const { getUsers, getOwnProfile } = mod;

  const { api } = await import('@/configs/api-config');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createStore(preloadedUsersState?: any) {
    return configureStore({
      reducer: { users: usersReducer },
      preloadedState: preloadedUsersState ? { users: preloadedUsersState } : undefined,
    });
  }

  function getUsersInitialState() {
    return usersReducer(undefined, { type: '@@INIT' });
  }

  describe('getUsers', () => {
    it('should call api.get and populate users (adapter setAll) on fulfilled', async () => {
      const usersList = [
        { id: 'u-1', name: 'Alice', email: 'alice@example.com', avatar: '' },
        { id: 'u-2', name: 'Bob', email: 'bob@example.com', avatar: '' },
      ];

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { users: usersList } },
      });

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getUsers());

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/users');

      expect(result.type).toBe(getUsers.fulfilled.type);

      const state = store.getState().users;
      expect(state.listStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.error).toBeNull();

      expect(state.ids).toEqual(['u-1', 'u-2']);
      expect(state.entities['u-1']).toEqual(usersList[0]);
      expect(state.entities['u-2']).toEqual(usersList[1]);
    });

    it('should call api.get and store rejectWithValue(toApiError) payload on rejected', async () => {
      const rawAxiosError = new Error('Network Error');
      (api.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(rawAxiosError);

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getUsers());

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/users');

      expect(result.type).toBe(getUsers.rejected.type);
      expect(result.payload).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });

      const state = store.getState().users;
      expect(state.listStatus).toBe(FETCH_STATUS.failed);
      expect(state.error).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });
    });

    it('should skip api.get when listStatus is succeeded and users already exist (condition cache)', async () => {
      const baseState = getUsersInitialState();

      const preloadedUsersState = {
        ...baseState,
        listStatus: FETCH_STATUS.succeeded,
        ids: ['u-1'],
        entities: {
          'u-1': { id: 'u-1', name: 'Cached', email: 'cached@example.com', avatar: '' },
        },
        error: null,
      };

      const store = createStore(preloadedUsersState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getUsers());

      expect(api.get).not.toHaveBeenCalled();

      expect(result.type).toBe(getUsers.rejected.type);
      expect((result as any).meta?.condition).toBe(true);

      const state = store.getState().users;
      expect(state.listStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.ids).toEqual(['u-1']);
      expect(state.entities['u-1']).toEqual(preloadedUsersState.entities['u-1']);
      expect(state.error).toBeNull();
    });

    it('should bypass cache and call api.get when force=true', async () => {
      const baseState = getUsersInitialState();

      const preloadedUsersState = {
        ...baseState,
        listStatus: FETCH_STATUS.succeeded,
        ids: ['u-1'],
        entities: {
          'u-1': { id: 'u-1', name: 'Cached', email: 'cached@example.com', avatar: '' },
        },
        error: null,
      };

      const freshUsersList = [{ id: 'u-2', name: 'Fresh', email: 'fresh@example.com', avatar: '' }];

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { users: freshUsersList } },
      });

      const store = createStore(preloadedUsersState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getUsers({ force: true }));

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/users');

      expect(result.type).toBe(getUsers.fulfilled.type);

      const state = store.getState().users;
      expect(state.listStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.error).toBeNull();

      expect(state.ids).toEqual(['u-2']);
      expect(state.entities['u-2']).toEqual(freshUsersList[0]);
      expect(state.entities['u-1']).toBeUndefined();
    });
  });

  describe('getOwnProfile', () => {
    it('should call api.get and populate me on fulfilled', async () => {
      const me = { id: 'u-me', name: 'Me', email: 'me@example.com', avatar: '' };

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { user: me } },
      });

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getOwnProfile());

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/users/me');

      expect(result.type).toBe(getOwnProfile.fulfilled.type);

      const state = store.getState().users;
      expect(state.preloadStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.me).toEqual(me);
      expect(state.error).toBeNull();
    });

    it('should call api.get, store rejectWithValue(toApiError) payload on rejected, and call api.removeToken()', async () => {
      const rawAxiosError = new Error('Unauthorized');
      (api.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(rawAxiosError);

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getOwnProfile());

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/users/me');

      expect(result.type).toBe(getOwnProfile.rejected.type);
      expect(result.payload).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });

      const state = store.getState().users;
      expect(state.preloadStatus).toBe(FETCH_STATUS.failed);
      expect(state.error).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });

      expect(api.removeToken).toHaveBeenCalledTimes(1);
    });

    it('should skip api.get when me already exists (condition cache)', async () => {
      const baseState = getUsersInitialState();

      const preloadedUsersState = {
        ...baseState,
        preloadStatus: FETCH_STATUS.succeeded,
        me: { id: 'u-me', name: 'Cached Me', email: 'cachedme@example.com', avatar: '' },
        error: null,
      };

      const store = createStore(preloadedUsersState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getOwnProfile());

      expect(api.get).not.toHaveBeenCalled();

      expect(result.type).toBe(getOwnProfile.rejected.type);
      expect((result as any).meta?.condition).toBe(true);

      const state = store.getState().users;
      expect(state.me).toEqual(preloadedUsersState.me);
      expect(state.preloadStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.error).toBeNull();
    });

    it('should bypass cache and call api.get when force=true', async () => {
      const baseState = getUsersInitialState();

      const preloadedUsersState = {
        ...baseState,
        preloadStatus: FETCH_STATUS.succeeded,
        me: { id: 'u-me', name: 'Cached Me', email: 'cachedme@example.com', avatar: '' },
        error: null,
      };

      const freshMe = { id: 'u-me', name: 'Fresh Me', email: 'freshme@example.com', avatar: '' };

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { user: freshMe } },
      });

      const store = createStore(preloadedUsersState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getOwnProfile({ force: true }));

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/users/me');

      expect(result.type).toBe(getOwnProfile.fulfilled.type);

      const state = store.getState().users;
      expect(state.preloadStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.me).toEqual(freshMe);
      expect(state.error).toBeNull();
    });
  });
});
