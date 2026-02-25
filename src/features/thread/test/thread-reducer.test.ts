import { describe, expect, it, vi } from 'vitest';

import { FETCH_STATUS } from '@/utils/constants/fetch-status';

import reducer, { getThreads } from '../redux/thread-slice';

vi.mock('@/configs/api-config', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/configs/auth/jwt-service', async () => {
  // cukup mock yang dipakai slice saat import
  return {
    toApiError: (e: unknown) => e,
  };
});

describe('threads slice - reducer tests (extraReducers)', () => {
  describe('getThreads.pending', () => {
    it('set listStatus=loading dan error=null', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });

      const stateWithError = {
        ...initialState,
        error: { message: 'previous error' },
      };

      const nextState = reducer(stateWithError, { type: getThreads.pending.type });

      expect(nextState.listStatus).toBe(FETCH_STATUS.loading);
      expect(nextState.error).toBeNull();
    });

    it('tidak mengubah entities/ids/selectedId', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });

      // bikin state awal punya data agar bisa dipastikan tidak berubah
      const seededState = reducer(initialState, {
        type: getThreads.fulfilled.type,
        payload: [
          {
            id: 't-1',
            title: 'Thread 1',
            body: 'Body',
            category: 'general',
            createdAt: new Date().toISOString(),
            ownerId: 'u-1',
            upVotesBy: [],
            downVotesBy: [],
            totalComments: 0,
          },
        ],
      });

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
    it('set listStatus=succeeded dan error=null', () => {
      const s0 = reducer(undefined, { type: '@@INIT' });

      const sWithError = {
        ...s0,
        error: { message: 'previous error' },
      };

      const payloadThreads = [
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
      ];

      const s1 = reducer(sWithError, {
        type: getThreads.fulfilled.type,
        payload: payloadThreads,
      });

      expect(s1.listStatus).toBe('succeeded');
      expect(s1.error).toBeNull();
    });

    it('mengisi adapter state: ids & entities sesuai payload (dan tidak mengubah selectedId)', () => {
      const s0 = reducer(undefined, { type: '@@INIT' });

      const sSeed = {
        ...s0,
        selectedId: 't-selected',
      };

      const payloadThreads = [
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
          createdAt: '2026-02-25T11:00:00.000Z',
          ownerId: 'u-2',
          upVotesBy: ['u-9'],
          downVotesBy: [],
          totalComments: 3,
        },
      ];

      const s1 = reducer(sSeed, {
        type: getThreads.fulfilled.type,
        payload: payloadThreads,
      });

      // ✅ entityAdapter assertions
      expect(s1.ids).toEqual(['t-2', 't-1']);
      expect(s1.entities['t-1']?.title).toBe('Thread 1');
      expect(s1.entities['t-2']?.category).toBe('tech');
      expect(s1.entities['t-2']?.totalComments).toBe(3);

      // ✅ pastikan field non-adapter tetap sesuai kebijakan slice
      expect(s1.selectedId).toBe('t-selected');
    });
  });

  describe('getThreads.rejected', () => {
    it('set listStatus=failed dan mengisi error dari action.payload', () => {
      const s0 = reducer(undefined, { type: '@@INIT' });

      const mockError = {
        message: 'Unauthorized',
        status: 401,
      };

      const s1 = reducer(s0, {
        type: getThreads.rejected.type,
        payload: mockError, // biasanya karena rejectWithValue
      });

      expect(s1.listStatus).toBe('failed');
      expect(s1.error).toEqual(mockError);
    });

    it('tidak mengubah data adapter (ids & entities tetap sama)', () => {
      const s0 = reducer(undefined, { type: '@@INIT' });

      // Seed data via fulfilled dulu
      const seeded = reducer(s0, {
        type: getThreads.fulfilled.type,
        payload: [
          {
            id: 't-1',
            title: 'Thread 1',
            body: 'Body',
            category: 'general',
            createdAt: '2026-02-25T10:00:00.000Z',
            ownerId: 'u-1',
            upVotesBy: [],
            downVotesBy: [],
            totalComments: 0,
          },
        ],
      });

      const idsBefore = seeded.ids;
      const entitiesBefore = seeded.entities;

      const s1 = reducer(seeded, {
        type: getThreads.rejected.type,
        payload: { message: 'Server error' },
      });

      expect(s1.ids).toEqual(idsBefore);
      expect(s1.entities).toEqual(entitiesBefore);
      expect(s1.listStatus).toBe('failed');
    });
  });
});
