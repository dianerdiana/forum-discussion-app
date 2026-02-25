import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

import type { AppDispatch } from '@/redux/store';

import { handleUpVoteThread } from '../redux/thread-slice';

// 1) Mock api-config: kita kontrol api.get
vi.mock('@/configs/api-config', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// 2) Mock jwt-service helper (kalau slice import toApiError)
vi.mock('@/configs/auth/jwt-service', () => ({
  toApiError: (e: unknown) => ({
    message: 'Mocked API Error',
    original: e,
  }),
}));

describe('threads thunks', async () => {
  const mod = await import('../redux/thread-slice');
  const threadsReducer = mod.default;
  const { getThreads } = mod;

  // Ambil api mock yang sudah di-mock oleh vi.mock
  const { api } = await import('@/configs/api-config');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getThreads -> fulfilled: memanggil api.get dan mengisi adapter state', async () => {
    // Arrange: response shape harus sama seperti yang thunk kamu return
    // Dari snippet kamu: return response.data.data.threads (atau response.data)
    // Sesuaikan di bawah dengan implementasi thunk kamu.
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
        createdAt: '2026-02-25T11:00:00.000Z',
        ownerId: 'u-2',
        upVotesBy: ['u-9'],
        downVotesBy: [],
        totalComments: 3,
      },
    ];

    (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { data: { threads: threadList } },
    });

    const store = configureStore({
      reducer: { threads: threadsReducer },
    });
    const dispatch: AppDispatch = store.dispatch;

    // Act
    const result = await dispatch(getThreads());

    // Assert 1: api call
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/threads');

    // Assert 2: thunk result
    expect(result.type).toBe(getThreads.fulfilled.type);

    // Assert 3: state updated
    const state = store.getState().threads;

    expect(state.listStatus).toBe('succeeded');
    expect(state.error).toBeNull();
    expect(state.ids).toEqual(['t-2', 't-1']);
    expect(state.entities['t-2']?.totalComments).toBe(3);
  });

  it('getThreads -> rejected: memanggil api.get dan mengisi error dari rejectWithValue(toApiError)', async () => {
    // Arrange
    const rawAxiosError = new Error('Network Error');
    (api.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(rawAxiosError);

    const store = configureStore({
      reducer: { threads: threadsReducer },
    });
    const dispatch: AppDispatch = store.dispatch;

    // Act
    const result = await dispatch(getThreads());

    // Assert 1: api call
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/threads');

    // Assert 2: thunk result rejected
    expect(result.type).toBe(getThreads.rejected.type);

    // penting: kalau thunk pakai rejectWithValue, payload berisi nilai rejectValue
    expect(result.payload).toEqual({
      message: 'Mocked API Error',
      original: rawAxiosError,
    });

    // Assert 3: state updated
    const state = store.getState().threads;
    expect(state.listStatus).toBe('failed');
    expect(state.error).toEqual({
      message: 'Mocked API Error',
      original: rawAxiosError,
    });
  });

  it('handleUpVoteThread -> fulfilled: memanggil api.post dan update votes pada thread entity', async () => {
    // Arrange: siapkan thread awal di store (entityAdapter shape: ids/entities)
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
          downVotesBy: [userId], // <-- penting: kita pastikan nanti terhapus
          totalComments: 0,
          // field lain boleh ada/tdk, sesuai type Thread kamu
        },
      },
    };

    // Mock response API sesuai thunk kamu:
    // thunk return response.data, dan reducer fulfilled baca action.payload.data.vote.userId
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

    const store = configureStore({
      reducer: { threads: threadsReducer },
      preloadedState: { threads: preloadedThreadsState },
    });

    const dispatch: AppDispatch = store.dispatch;

    // Act
    const result = await dispatch(handleUpVoteThread({ threadId, userId }));

    // Assert 1: api dipanggil benar
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith(`/threads/${threadId}/up-vote`);

    // Assert 2: thunk fulfilled
    expect(result.type).toBe(handleUpVoteThread.fulfilled.type);

    // Assert 3: state thread ter-update (downVotesBy hilang, upVotesBy bertambah)
    const state = store.getState().threads;
    const thread = state.entities[threadId];

    expect(state.upVoteThreadStatus).toBe('succeeded');
    expect(thread).toBeTruthy();

    expect(thread.downVotesBy).not.toContain(userId);
    expect(thread.upVotesBy).toContain(userId);

    // (opsional) pastikan request in-flight sudah dibersihkan (sesuai reducer kamu)
    expect(state.voteInFlightByThreadId[threadId]).toBeNull();
  });
});
