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

describe('leaderboards thunks', async () => {
  const mod = await import('../../redux/leaderboard-slice');
  const leaderboardsReducer = mod.default;
  const { getLeaderboards } = mod;

  const { api } = await import('@/configs/api-config');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createStore(preloadedLeaderboardsState?: any) {
    return configureStore({
      reducer: { leaderboards: leaderboardsReducer },
      preloadedState: preloadedLeaderboardsState ? { leaderboards: preloadedLeaderboardsState } : undefined,
    });
  }

  describe('getLeaderboards', () => {
    it('should call api.get and populate leaderboards items on fulfilled', async () => {
      const leaderboardList = [
        {
          user: {
            id: 'u-1',
            name: 'Alice',
            email: 'alice@example.com',
            avatar: '',
          },
          score: 120,
        },
        {
          user: {
            id: 'u-2',
            name: 'Bob',
            email: 'bob@example.com',
            avatar: '',
          },
          score: 90,
        },
      ];

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { leaderboards: leaderboardList } },
      });

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getLeaderboards());

      // API call
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/leaderboards');

      // Thunk result
      expect(result.type).toBe(getLeaderboards.fulfilled.type);

      // State updated
      const state = store.getState().leaderboards;

      expect(state.listStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.items).toEqual(leaderboardList);
      expect(state.error).toBeNull(); // you updated fulfilled to clear error
    });

    it('should call api.get and store the rejectWithValue(toApiError) payload on rejected', async () => {
      const rawAxiosError = new Error('Network Error');
      (api.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(rawAxiosError);

      const store = createStore();
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getLeaderboards());

      // API call
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/leaderboards');

      // Thunk result
      expect(result.type).toBe(getLeaderboards.rejected.type);

      // If thunk uses rejectWithValue, payload should be the rejectValue
      expect(result.payload).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });

      // State updated
      const state = store.getState().leaderboards;

      expect(state.listStatus).toBe(FETCH_STATUS.failed);
      expect(state.error).toEqual({
        message: 'Mocked API Error',
        original: rawAxiosError,
      });
    });

    it('should skip api.get when listStatus is succeeded and items already exist (condition cache)', async () => {
      const baseState = leaderboardsReducer(undefined, { type: '@@INIT' });

      const preloadedLeaderboardsState = {
        ...baseState,
        listStatus: FETCH_STATUS.succeeded,
        items: [
          {
            user: { id: 'u-1', name: 'Cached', email: 'cached@example.com', avatar: '' },
            score: 999,
          },
        ],
        error: null,
      };

      const store = createStore(preloadedLeaderboardsState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getLeaderboards());

      // Condition should prevent the request
      expect(api.get).not.toHaveBeenCalled();

      // When condition returns false, RTK returns a rejected action (not dispatched by default),
      // so the state should stay the same.
      expect(result.type).toBe(getLeaderboards.rejected.type);
      expect((result as any).meta?.condition).toBe(true);

      const state = store.getState().leaderboards;
      expect(state.listStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.items).toEqual(preloadedLeaderboardsState.items);
      expect(state.error).toBeNull();
    });

    it('should bypass cache and call api.get when force=true', async () => {
      const baseState = leaderboardsReducer(undefined, { type: '@@INIT' });

      const preloadedLeaderboardsState = {
        ...baseState,
        listStatus: FETCH_STATUS.succeeded,
        items: [
          {
            user: { id: 'u-1', name: 'Cached', email: 'cached@example.com', avatar: '' },
            score: 999,
          },
        ],
        error: null,
      };

      const freshLeaderboardList = [
        {
          user: { id: 'u-2', name: 'Fresh', email: 'fresh@example.com', avatar: '' },
          score: 111,
        },
      ];

      (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { leaderboards: freshLeaderboardList } },
      });

      const store = createStore(preloadedLeaderboardsState);
      const dispatch: AppDispatch = store.dispatch;

      const result = await dispatch(getLeaderboards({ force: true }));

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/leaderboards');

      expect(result.type).toBe(getLeaderboards.fulfilled.type);

      const state = store.getState().leaderboards;
      expect(state.listStatus).toBe(FETCH_STATUS.succeeded);
      expect(state.items).toEqual(freshLeaderboardList);
      expect(state.error).toBeNull();
    });
  });
});
