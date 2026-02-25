import { type PayloadAction, createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import { api } from '@/configs/api-config';
import { toApiError } from '@/configs/auth/jwt-service';
import type { RootState } from '@/redux/store';
import type { Comment } from '@/types/comment-type';
import type { Thread } from '@/types/thread-type';
import type { Vote } from '@/types/vote-type';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

import type { CreateCommentType } from '../types/create-comment-type';
import type { CreateThreadType } from '../types/create-thread-type';

type ThreadState = {
  selectedId: string | null;

  listStatus: string;
  detailStatus: string;
  createThreadStatus: string;
  createCommentStatus: string;
  upVoteStatus: string;
  downVoteStatus: string;
  neutralVoteStatus: string;
  voteOptimistic: Record<string, { threadId: string; userId: string; prev: { up: boolean; down: boolean } }>;
  voteInFlightByThreadId: Record<string, string | null>; // threadId -> requestId

  error: unknown | null;
};

type ThunkThreadArgs = {
  showGlobalLoading?: boolean; // default true
  force?: boolean; // kalau mau bypass cache/condition
};

type VoteArgs = ThunkThreadArgs & { threadId: string; userId: string };

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
  upVoteStatus: FETCH_STATUS.idle,
  downVoteStatus: FETCH_STATUS.idle,
  neutralVoteStatus: FETCH_STATUS.idle,

  voteOptimistic: {},
  voteInFlightByThreadId: {},

  error: null,
});

const addUniqueVote = (arr: string[], userId: string) => {
  if (!arr.includes(userId)) arr.push(userId);
};

const removeUserFromVote = (arr: string[], userId: string) => arr.filter((id) => id !== userId);

const voteThreadCondition = (arg: VoteArgs, { getState }: { getState: () => RootState }) => {
  const state = getState();

  // bypass kalau memang ingin (mis. untuk recovery)
  if (arg.force) return true;

  const inFlight = state.threads.voteInFlightByThreadId[arg.threadId];
  // kalau masih ada requestId tercatat, berarti sedang vote untuk thread itu
  if (inFlight) return false;

  return true;
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

      const force = arg?.force === true;
      if (force) return true;
      if (listStatus === FETCH_STATUS.loading) return false;

      const hasData = ids.length > 0;
      if (listStatus === FETCH_STATUS.succeeded && hasData) return false;

      return true;
    },
  },
);

export const getThread = createAsyncThunk<Thread, VoteArgs, { state: RootState; rejectValue: unknown }>(
  'threads/getThread',
  async ({ threadId }, thunkApi) => {
    try {
      const res = await api.get(`/threads/${threadId}`);
      return res.data.data.detailThread as Thread;
    } catch (e) {
      return thunkApi.rejectWithValue(toApiError(e));
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState();
      const force = arg.force === true;
      if (force) return true;

      if (state.threads.detailStatus === FETCH_STATUS.loading) return false;

      const existing = state.threads.entities[arg.threadId];
      if (!existing) return true;

      // list ada, tapi detail belum -> fetch
      if (!Array.isArray(existing.comments)) return true;

      return false;
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

export const handleUpVote = createAsyncThunk<
  { message: string; status: string; data: { vote: Vote } },
  VoteArgs,
  { state: RootState; rejectValue: unknown }
>(
  'threads/handleUpVote',
  async (payload, thunkApi) => {
    try {
      const response = await api.post(`/threads/${payload.threadId}/up-vote`);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  { condition: voteThreadCondition },
);

export const handleDownVote = createAsyncThunk<
  { message: string; status: string; data: { vote: Vote } },
  VoteArgs,
  { state: RootState; rejectValue: unknown }
>(
  'threads/handleDownVote',
  async (payload, thunkApi) => {
    try {
      const response = await api.post(`/threads/${payload.threadId}/down-vote`);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  { condition: voteThreadCondition },
);

export const handleNeutralVote = createAsyncThunk<
  { message: string; status: string; data: { vote: Vote } },
  VoteArgs,
  { state: RootState; rejectValue: unknown }
>(
  'threads/handleNeutralVote',
  async (payload, thunkApi) => {
    try {
      const response = await api.post(`/threads/${payload.threadId}/neutral-vote`);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  { condition: voteThreadCondition },
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

      const merged = action.payload.map((incoming) => {
        const existing = state.entities[incoming.id];

        if (!existing) return incoming;

        return {
          ...existing,
          ...incoming,
          // pertahankan field detail yang tidak ada di list
          owner: existing.owner,
          comments: existing.comments,
        };
      });

      threadsAdapter.setAll(state, merged);
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

      const incoming = action.payload;
      const existing = state.entities[incoming.id];

      const merged: Thread = {
        ...(existing as Thread | undefined),
        ...incoming,
        // bridge: bikin totalComments selalu ada
        totalComments:
          incoming.totalComments ??
          (Array.isArray(incoming.comments) ? incoming.comments.length : (existing?.totalComments ?? 0)),
      };

      threadsAdapter.upsertOne(state, merged);
      state.selectedId = incoming.id;
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

      // update count untuk list
      thread.totalComments = (thread.totalComments ?? 0) + 1;

      // update detail list komentar kalau sudah ada
      if (Array.isArray(thread.comments)) {
        thread.comments.unshift(action.payload.data.comment);
      }
    });
    builder.addCase(createComment.rejected, (state, action) => {
      state.createCommentStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;
    });

    // handleUpVote
    builder.addCase(handleUpVote.pending, (state, action) => {
      state.upVoteStatus = FETCH_STATUS.loading;
      state.error = null;

      const { threadId, userId } = action.meta.arg;
      state.voteInFlightByThreadId[threadId] = action.meta.requestId;

      const thread = state.entities[threadId];
      if (!thread) return;

      state.voteOptimistic[action.meta.requestId] = {
        threadId,
        userId,
        prev: {
          up: thread.upVotesBy.includes(userId),
          down: thread.downVotesBy.includes(userId),
        },
      };

      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, userId);
      addUniqueVote(thread.upVotesBy, userId);
    });
    builder.addCase(handleUpVote.fulfilled, (state, action) => {
      state.upVoteStatus = FETCH_STATUS.succeeded;
      delete state.voteOptimistic[action.meta.requestId];

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const thread = state.entities[threadId];
      if (!thread) return;

      const userId = action.payload.data.vote.userId;
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, userId);
      addUniqueVote(thread.upVotesBy, userId);
    });
    builder.addCase(handleUpVote.rejected, (state, action) => {
      state.upVoteStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const snap = state.voteOptimistic[action.meta.requestId];
      delete state.voteOptimistic[action.meta.requestId];
      if (!snap) return;
      const thread = state.entities[snap.threadId];
      if (!thread) return;

      // rollback
      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, snap.userId);
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, snap.userId);

      if (snap.prev.up) addUniqueVote(thread.upVotesBy, snap.userId);
      if (snap.prev.down) addUniqueVote(thread.downVotesBy, snap.userId);
    });

    // handleDownVote
    builder.addCase(handleDownVote.pending, (state, action) => {
      state.downVoteStatus = FETCH_STATUS.loading;
      state.error = null;

      const { threadId, userId } = action.meta.arg;
      state.voteInFlightByThreadId[threadId] = action.meta.requestId;

      const thread = state.entities[threadId];
      if (!thread) return;

      state.voteOptimistic[action.meta.requestId] = {
        threadId,
        userId,
        prev: {
          up: thread.upVotesBy.includes(userId),
          down: thread.downVotesBy.includes(userId),
        },
      };

      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, userId);
      addUniqueVote(thread.downVotesBy, userId);
    });
    builder.addCase(handleDownVote.fulfilled, (state, action) => {
      state.downVoteStatus = FETCH_STATUS.succeeded;
      delete state.voteOptimistic[action.meta.requestId];

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const thread = state.entities[threadId];
      if (!thread) return;

      const userId = action.payload.data.vote.userId;
      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, userId);
      addUniqueVote(thread.downVotesBy, userId);
    });
    builder.addCase(handleDownVote.rejected, (state, action) => {
      state.upVoteStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const snap = state.voteOptimistic[action.meta.requestId];
      delete state.voteOptimistic[action.meta.requestId];
      if (!snap) return;

      const thread = state.entities[snap.threadId];
      if (!thread) return;

      // rollback
      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, snap.userId);
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, snap.userId);

      if (snap.prev.up) addUniqueVote(thread.upVotesBy, snap.userId);
      if (snap.prev.down) addUniqueVote(thread.downVotesBy, snap.userId);
    });

    // handleNeutralVote
    builder.addCase(handleNeutralVote.pending, (state, action) => {
      state.neutralVoteStatus = FETCH_STATUS.loading;
      state.error = null;

      const { threadId, userId } = action.meta.arg;
      state.voteInFlightByThreadId[threadId] = action.meta.requestId;

      const thread = state.entities[threadId];
      if (!thread) return;

      state.voteOptimistic[action.meta.requestId] = {
        threadId,
        userId,
        prev: {
          up: thread.upVotesBy.includes(userId),
          down: thread.downVotesBy.includes(userId),
        },
      };

      // set to NEUTRAL
      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, userId);
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, userId);
    });
    builder.addCase(handleNeutralVote.fulfilled, (state, action) => {
      state.neutralVoteStatus = FETCH_STATUS.succeeded;
      delete state.voteOptimistic[action.meta.requestId];

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const thread = state.entities[threadId];
      if (!thread) return;

      const userId = action.payload.data.vote.userId;
      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, userId);
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, userId);
    });
    builder.addCase(handleNeutralVote.rejected, (state, action) => {
      state.neutralVoteStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const snap = state.voteOptimistic[action.meta.requestId];
      delete state.voteOptimistic[action.meta.requestId];
      if (!snap) return;

      const thread = state.entities[snap.threadId];
      if (!thread) return;

      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, snap.userId);
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, snap.userId);

      if (snap.prev.up) addUniqueVote(thread.upVotesBy, snap.userId);
      if (snap.prev.down) addUniqueVote(thread.downVotesBy, snap.userId);
    });
  },
});

export const { setSelectedThread, clearThreadError } = threadSlice.actions;

export default threadSlice.reducer;

//  Selectors (entity adapter selectors)
export const threadSelectors = threadsAdapter.getSelectors<RootState>((state) => state.threads);
export const selectThreadsListStatus = (state: RootState) => state.threads.listStatus;

export const selectSelectedThread = (state: RootState) => {
  const id = state.threads.selectedId;
  return id ? (state.threads.entities[id] ?? null) : null;
};
