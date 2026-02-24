import { type PayloadAction, createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import { api } from '@/configs/api-config';
import { toApiError } from '@/configs/auth/jwt-service';
import type { RootState } from '@/redux/store';
import type { Comment } from '@/types/comment-type';
import type { Thread } from '@/types/thread-type';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

import type { CreateCommentType } from '../types/create-comment-type';
import type { CreateThreadType } from '../types/create-thread-type';

type ThreadState = {
  selectedId: string | null;

  listStatus: string;
  detailStatus: string;
  createThreadStatus: string;
  createCommentStatus: string;

  error: unknown | null;
};

// Entity Adapter
const threadsAdapter = createEntityAdapter<Thread>({
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

const initialState = threadsAdapter.getInitialState<ThreadState>({
  selectedId: null,
  listStatus: FETCH_STATUS.idle,
  detailStatus: FETCH_STATUS.idle,
  createThreadStatus: FETCH_STATUS.idle,
  createCommentStatus: FETCH_STATUS.idle,
  error: null,
});

type ThunkThreadArgs = {
  showGlobalLoading?: boolean; // default true
  force?: boolean; // kalau mau bypass cache/condition
};

// Thunks
export const getThreads = createAsyncThunk<
  Thread[],
  ThunkThreadArgs | void,
  { state: RootState; rejectValue: unknown }
>(
  'threads/getThreads',
  async (_arg, thunkApi) => {
    try {
      const response = await api.get('/threads');
      return response.data.data.threads as Thread[];
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState();
      const { listStatus, ids } = state.threads;

      const force = (arg as ThunkThreadArgs | undefined)?.force === true;

      if (force) return true;
      if (listStatus === FETCH_STATUS.loading) return false;

      const hasData = ids.length > 0;
      if (listStatus === FETCH_STATUS.succeeded && hasData) return false;

      return true;
    },
  },
);

export const getThread = createAsyncThunk<
  Thread,
  ThunkThreadArgs & { threadId: string },
  { state: RootState; rejectValue: unknown }
>(
  'threads/getThread',
  async (arg, thunkApi) => {
    try {
      const response = await api.get(`/threads/${arg.threadId}`);
      return response.data.data.detailThread as Thread;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState();
      const { detailStatus } = state.threads;

      const force = (arg as ThunkThreadArgs | undefined)?.force === true;

      if (force) return true;
      if (detailStatus === FETCH_STATUS.loading) return false;

      // kalau thread sudah ada di store, skip fetch detail
      const exists = state.threads.entities[arg.threadId];
      if (exists) return false;

      return true;
    },
  },
);

export const createThread = createAsyncThunk<
  { message: string; status: string; data: { thread: Thread } },
  CreateThreadType,
  { rejectValue: unknown }
>('threads/createThread', async (payload, thunkApi) => {
  try {
    const response = await api.post('/threads', payload);
    return response.data;
  } catch (error) {
    return thunkApi.rejectWithValue(toApiError(error));
  }
});

export const createComment = createAsyncThunk<
  { message: string; status: string; data: { comment: Comment } },
  CreateCommentType & { threadId: string },
  { rejectValue: unknown }
>('threads/createComment', async ({ threadId, content }, thunkApi) => {
  try {
    const response = await api.post(`/threads/${threadId}/comments`, { content });
    return response.data;
  } catch (error) {
    return thunkApi.rejectWithValue(toApiError(error));
  }
});

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
      state.createThreadStatus = FETCH_STATUS.loading;
      state.error = null;
    });
    builder.addCase(createThread.fulfilled, (state, action) => {
      state.createThreadStatus = FETCH_STATUS.succeeded;
      threadsAdapter.addOne(state, action.payload.data.thread);
      state.selectedId = action.payload.data.thread.id;
    });
    builder.addCase(createThread.rejected, (state, action) => {
      state.createThreadStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;
    });

    // createComment
    builder.addCase(createComment.pending, (state) => {
      state.createCommentStatus = FETCH_STATUS.loading;
      state.error = null;
    });
    builder.addCase(createComment.fulfilled, (state, action) => {
      state.createCommentStatus = FETCH_STATUS.succeeded;

      const { threadId } = action.meta.arg;
      const thread = state.entities[threadId];
      if (!thread) return;

      if (!thread.comments) thread.comments = [];

      // update comment
      thread.comments.unshift(action.payload.data.comment);

      // update counter
      thread.totalComments = (thread.totalComments ?? 0) + 1;
    });
    builder.addCase(createComment.rejected, (state, action) => {
      state.createCommentStatus = FETCH_STATUS.failed;
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
