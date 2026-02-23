import { type PayloadAction, createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import { api } from '@/configs/api-config';
import { toApiError } from '@/configs/auth/jwt-service';
import type { RootState } from '@/redux/store';
import type { Thread } from '@/types/thread-type';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

type ThreadState = {
  selectedId: string | null;

  listStatus: string;
  detailStatus: string;
  createStatus: string;

  error: unknown | null;
};

// Entity Adapter
const threadsAdapter = createEntityAdapter<Thread>();

const initialState = threadsAdapter.getInitialState<ThreadState>({
  selectedId: null,
  listStatus: FETCH_STATUS.idle,
  detailStatus: FETCH_STATUS.idle,
  createStatus: FETCH_STATUS.idle,
  error: null,
});

// Thunks
export const getThreads = createAsyncThunk<Thread[], void, { state: RootState; rejectValue: unknown }>(
  'threads/getThreads',
  async (_: void, thunkApi) => {
    try {
      const response = await api.get('/threads');
      return response.data.data.threads as Thread[];
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  {
    // prevent duplicate fetch kalau sedang loading / sudah pernah sukses
    condition: (_arg, { getState }) => {
      const { threads } = getState();
      if (threads.listStatus === FETCH_STATUS.loading) return false;
      // kalau sudah succeeded & ada data, skip
      const hasData = threads.ids.length > 0;
      if (threads.listStatus === FETCH_STATUS.succeeded && hasData) return false;
      return true;
    },
  },
);

export const getThread = createAsyncThunk<Thread, string, { state: RootState; rejectValue: unknown }>(
  'threads/getThread',
  async (id: string, thunkApi) => {
    try {
      const response = await api.get(`/threads/${id}`);
      return response.data.data.thread as Thread;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (id, { getState }) => {
      const { threads } = getState();

      if (threads.detailStatus === FETCH_STATUS.loading) return false;

      // kalau thread sudah ada di store, skip fetch detail
      const exists = threads.entities[id];
      if (exists) return false;

      return true;
    },
  },
);

export const createThread = createAsyncThunk<Thread, Omit<Thread, 'id'>, { rejectValue: unknown }>(
  'threads/createThread',
  async (payload, thunkApi) => {
    try {
      const response = await api.post('/threads', payload);
      return response.data.data.thread as Thread;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
);

// Slice
const threadSlice = createSlice({
  name: 'threads',
  initialState,
  reducers: {
    setSelectedThread(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    clearThreadError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    // getThreads
    builder.addCase(getThreads.pending, (state) => {
      state.listStatus = FETCH_STATUS.loading;
      state.error = null;
    });
    builder.addCase(getThreads.fulfilled, (state, action) => {
      state.listStatus = FETCH_STATUS.succeeded;
      threadsAdapter.setAll(state, action.payload);
    });
    builder.addCase(getThreads.rejected, (state, action) => {
      state.listStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;
    });

    // getThread
    builder.addCase(getThread.pending, (state) => {
      state.detailStatus = FETCH_STATUS.loading;
      state.error = null;
    });
    builder.addCase(getThread.fulfilled, (state, action) => {
      state.detailStatus = FETCH_STATUS.succeeded;
      threadsAdapter.upsertOne(state, action.payload);
      state.selectedId = action.payload.id;
    });
    builder.addCase(getThread.rejected, (state, action) => {
      state.detailStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;
    });

    // createThread
    builder.addCase(createThread.pending, (state) => {
      state.createStatus = FETCH_STATUS.loading;
      state.error = null;
    });
    builder.addCase(createThread.fulfilled, (state, action) => {
      state.createStatus = FETCH_STATUS.succeeded;
      threadsAdapter.addOne(state, action.payload);
      state.selectedId = action.payload.id;
    });
    builder.addCase(createThread.rejected, (state, action) => {
      state.createStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;
    });
  },
});

export const { setSelectedThread, clearThreadError } = threadSlice.actions;

export default threadSlice.reducer;

// ===== Selectors (entity adapter selectors)
export const threadSelectors = threadsAdapter.getSelectors<RootState>((state) => state.threads);
export const selectThreadsListStatus = (state: RootState) => state.threads.listStatus;

export const selectSelectedThread = (state: RootState) => {
  const id = state.threads.selectedId;
  return id ? (state.threads.entities[id] ?? null) : null;
};
