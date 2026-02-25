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
  upVoteThreadStatus: string;
  downVoteThreadStatus: string;
  neutralVoteThreadStatus: string;
  upVoteCommentStatus: string;
  downVoteCommentStatus: string;
  neutralVoteCommentStatus: string;
  voteOptimisticThread: Record<string, { threadId: string; userId: string; prev: { up: boolean; down: boolean } }>;
  voteOptimisticComment: Record<
    string,
    { threadId: string; commentId: string; userId: string; prev: { up: boolean; down: boolean } }
  >;
  voteInFlightByThreadId: Record<string, string | null>; // threadId -> requestId
  voteInFlightByCommentId: Record<string, string | null>; // commentId -> requestId

  error: unknown | null;
};

type ThunkThreadArgs = {
  showGlobalLoading?: boolean; // default true
  force?: boolean; // kalau mau bypass cache/condition
};

type VoteThreadArgs = ThunkThreadArgs & { threadId: string; userId: string };
type VoteCommentArgs = ThunkThreadArgs & { threadId: string; userId: string; commentId: string };

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
  upVoteThreadStatus: FETCH_STATUS.idle,
  downVoteThreadStatus: FETCH_STATUS.idle,
  neutralVoteThreadStatus: FETCH_STATUS.idle,
  upVoteCommentStatus: FETCH_STATUS.idle,
  downVoteCommentStatus: FETCH_STATUS.idle,
  neutralVoteCommentStatus: FETCH_STATUS.idle,

  voteOptimisticThread: {},
  voteOptimisticComment: {},
  voteInFlightByThreadId: {},
  voteInFlightByCommentId: {},

  error: null,
});

const addUniqueVote = (arrVotes: string[], userId: string) => {
  if (!arrVotes.includes(userId)) arrVotes.push(userId);
};

const removeUserFromVote = (arrVotes: string[], userId: string) => arrVotes.filter((id) => id !== userId);

const voteThreadCondition = (arg: VoteThreadArgs, { getState }: { getState: () => RootState }) => {
  const state = getState();

  // bypass kalau memang ingin (mis. untuk recovery)
  if (arg.force) return true;

  const inFlight = state.threads.voteInFlightByThreadId[arg.threadId];
  // kalau masih ada requestId tercatat, berarti sedang vote untuk thread itu
  if (inFlight) return false;

  return true;
};

const voteCommentCondition = (arg: VoteCommentArgs, { getState }: { getState: () => RootState }) => {
  const state = getState();

  // bypass kalau memang ingin (mis. untuk recovery)
  if (arg.force) return true;

  const inFlight = state.threads.voteInFlightByCommentId[arg.commentId];
  // kalau masih ada requestId tercatat, berarti sedang vote untuk comment itu
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

export const getThread = createAsyncThunk<
  Thread,
  ThunkThreadArgs & { threadId: string },
  { state: RootState; rejectValue: unknown }
>(
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

export const handleUpVoteThread = createAsyncThunk<
  { message: string; status: string; data: { vote: Vote } },
  VoteThreadArgs,
  { state: RootState; rejectValue: unknown }
>(
  'threads/handleUpVoteThread',
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

export const handleDownVoteThread = createAsyncThunk<
  { message: string; status: string; data: { vote: Vote } },
  VoteThreadArgs,
  { state: RootState; rejectValue: unknown }
>(
  'threads/handleDownVoteThread',
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

export const handleNeutralVoteThread = createAsyncThunk<
  { message: string; status: string; data: { vote: Vote } },
  VoteThreadArgs,
  { state: RootState; rejectValue: unknown }
>(
  'threads/handleNeutralVoteThread',
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

export const handleUpVoteComment = createAsyncThunk<
  { message: string; status: string; data: { vote: Vote } },
  VoteCommentArgs,
  { state: RootState; rejectValue: unknown }
>(
  'threads/handleUpVoteComment',
  async (payload, thunkApi) => {
    const { threadId, commentId } = payload;

    try {
      const response = await api.post(`/threads/${threadId}/comments/${commentId}/up-vote`);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  { condition: voteCommentCondition },
);

export const handleDownVoteComment = createAsyncThunk<
  { message: string; status: string; data: { vote: Vote } },
  VoteCommentArgs,
  { state: RootState; rejectValue: unknown }
>(
  'threads/handleDownVoteComment',
  async (payload, thunkApi) => {
    const { threadId, commentId } = payload;

    try {
      const response = await api.post(`/threads/${threadId}/comments/${commentId}/down-vote`);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  { condition: voteCommentCondition },
);

export const handleNeutralVoteComment = createAsyncThunk<
  { message: string; status: string; data: { vote: Vote } },
  VoteCommentArgs,
  { state: RootState; rejectValue: unknown }
>(
  'threads/handleNeutralVoteComment',
  async (payload, thunkApi) => {
    const { threadId, commentId } = payload;

    try {
      const response = await api.post(`/threads/${threadId}/comments/${commentId}/neutral-vote`);
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  { condition: voteCommentCondition },
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
      state.error = null;

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

    // handleUpVoteThread
    builder.addCase(handleUpVoteThread.pending, (state, action) => {
      state.upVoteThreadStatus = FETCH_STATUS.loading;
      state.error = null;

      const { threadId, userId } = action.meta.arg;
      state.voteInFlightByThreadId[threadId] = action.meta.requestId;

      const thread = state.entities[threadId];
      if (!thread) return;

      state.voteOptimisticThread[action.meta.requestId] = {
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
    builder.addCase(handleUpVoteThread.fulfilled, (state, action) => {
      state.upVoteThreadStatus = FETCH_STATUS.succeeded;
      delete state.voteOptimisticThread[action.meta.requestId];

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const thread = state.entities[threadId];
      if (!thread) return;

      const { userId } = action.payload.data.vote;
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, userId);
      addUniqueVote(thread.upVotesBy, userId);
    });
    builder.addCase(handleUpVoteThread.rejected, (state, action) => {
      state.upVoteThreadStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const snap = state.voteOptimisticThread[action.meta.requestId];
      delete state.voteOptimisticThread[action.meta.requestId];
      if (!snap) return;
      const thread = state.entities[snap.threadId];
      if (!thread) return;

      // rollback
      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, snap.userId);
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, snap.userId);

      if (snap.prev.up) addUniqueVote(thread.upVotesBy, snap.userId);
      if (snap.prev.down) addUniqueVote(thread.downVotesBy, snap.userId);
    });

    // handleDownVoteThread
    builder.addCase(handleDownVoteThread.pending, (state, action) => {
      state.downVoteThreadStatus = FETCH_STATUS.loading;
      state.error = null;

      const { threadId, userId } = action.meta.arg;
      state.voteInFlightByThreadId[threadId] = action.meta.requestId;

      const thread = state.entities[threadId];
      if (!thread) return;

      state.voteOptimisticThread[action.meta.requestId] = {
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
    builder.addCase(handleDownVoteThread.fulfilled, (state, action) => {
      state.downVoteThreadStatus = FETCH_STATUS.succeeded;
      delete state.voteOptimisticThread[action.meta.requestId];

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const thread = state.entities[threadId];
      if (!thread) return;

      const { userId } = action.payload.data.vote;
      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, userId);
      addUniqueVote(thread.downVotesBy, userId);
    });
    builder.addCase(handleDownVoteThread.rejected, (state, action) => {
      state.upVoteThreadStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const snap = state.voteOptimisticThread[action.meta.requestId];
      delete state.voteOptimisticThread[action.meta.requestId];
      if (!snap) return;

      const thread = state.entities[snap.threadId];
      if (!thread) return;

      // rollback
      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, snap.userId);
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, snap.userId);

      if (snap.prev.up) addUniqueVote(thread.upVotesBy, snap.userId);
      if (snap.prev.down) addUniqueVote(thread.downVotesBy, snap.userId);
    });

    // handleNeutralVoteThread
    builder.addCase(handleNeutralVoteThread.pending, (state, action) => {
      state.neutralVoteThreadStatus = FETCH_STATUS.loading;
      state.error = null;

      const { threadId, userId } = action.meta.arg;
      state.voteInFlightByThreadId[threadId] = action.meta.requestId;

      const thread = state.entities[threadId];
      if (!thread) return;

      state.voteOptimisticThread[action.meta.requestId] = {
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
    builder.addCase(handleNeutralVoteThread.fulfilled, (state, action) => {
      state.neutralVoteThreadStatus = FETCH_STATUS.succeeded;
      delete state.voteOptimisticThread[action.meta.requestId];

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const thread = state.entities[threadId];
      if (!thread) return;

      const { userId } = action.payload.data.vote;
      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, userId);
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, userId);
    });
    builder.addCase(handleNeutralVoteThread.rejected, (state, action) => {
      state.neutralVoteThreadStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;

      const { threadId } = action.meta.arg;
      if (state.voteInFlightByThreadId[threadId] === action.meta.requestId) {
        state.voteInFlightByThreadId[threadId] = null;
      }

      const snap = state.voteOptimisticThread[action.meta.requestId];
      delete state.voteOptimisticThread[action.meta.requestId];
      if (!snap) return;

      const thread = state.entities[snap.threadId];
      if (!thread) return;

      thread.upVotesBy = removeUserFromVote(thread.upVotesBy, snap.userId);
      thread.downVotesBy = removeUserFromVote(thread.downVotesBy, snap.userId);

      if (snap.prev.up) addUniqueVote(thread.upVotesBy, snap.userId);
      if (snap.prev.down) addUniqueVote(thread.downVotesBy, snap.userId);
    });

    // handleUpVoteComment
    builder.addCase(handleUpVoteComment.pending, (state, action) => {
      state.upVoteCommentStatus = FETCH_STATUS.loading;
      state.error = null;

      const { threadId, userId, commentId } = action.meta.arg;
      state.voteInFlightByCommentId[commentId] = action.meta.requestId;

      const thread = state.entities[threadId];
      if (!thread) return;

      if (Array.isArray(thread.comments)) {
        const comment = thread.comments.find((c) => c.id === commentId);
        if (!comment) return;

        state.voteOptimisticComment[action.meta.requestId] = {
          threadId,
          commentId,
          userId,
          prev: {
            up: comment.upVotesBy.includes(userId),
            down: comment.downVotesBy.includes(userId),
          },
        };

        comment.downVotesBy = removeUserFromVote(comment.downVotesBy, userId);
        addUniqueVote(comment.upVotesBy, userId);
      }
    });
    builder.addCase(handleUpVoteComment.fulfilled, (state, action) => {
      state.upVoteCommentStatus = FETCH_STATUS.succeeded;
      delete state.voteOptimisticComment[action.meta.requestId];

      const { threadId, commentId } = action.meta.arg;
      if (state.voteInFlightByCommentId[commentId] === action.meta.requestId) {
        state.voteInFlightByCommentId[commentId] = null;
      }

      const thread = state.entities[threadId];
      if (!thread) return;

      if (Array.isArray(thread.comments)) {
        const comment = thread.comments.find((c) => c.id === commentId);
        if (!comment) return;

        const { userId } = action.payload.data.vote;
        comment.downVotesBy = removeUserFromVote(comment.downVotesBy, userId);
        addUniqueVote(comment.upVotesBy, userId);
      }
    });
    builder.addCase(handleUpVoteComment.rejected, (state, action) => {
      state.upVoteCommentStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;

      const { commentId } = action.meta.arg;
      if (state.voteInFlightByCommentId[commentId] === action.meta.requestId) {
        state.voteInFlightByCommentId[commentId] = null;
      }

      const snap = state.voteOptimisticComment[action.meta.requestId];
      delete state.voteOptimisticComment[action.meta.requestId];
      if (!snap) return;
      const thread = state.entities[snap.threadId];
      if (!thread) return;

      if (Array.isArray(thread.comments)) {
        const comment = thread.comments.find((c) => c.id === commentId);
        if (!comment) return;

        // rollback
        comment.upVotesBy = removeUserFromVote(comment.upVotesBy, snap.userId);
        comment.downVotesBy = removeUserFromVote(comment.downVotesBy, snap.userId);

        if (snap.prev.up) addUniqueVote(comment.upVotesBy, snap.userId);
        if (snap.prev.down) addUniqueVote(comment.downVotesBy, snap.userId);
      }
    });

    // handleDownVoteComment
    builder.addCase(handleDownVoteComment.pending, (state, action) => {
      state.downVoteCommentStatus = FETCH_STATUS.loading;
      state.error = null;

      const { threadId, userId, commentId } = action.meta.arg;
      state.voteInFlightByCommentId[commentId] = action.meta.requestId;

      const thread = state.entities[threadId];
      if (!thread) return;

      if (Array.isArray(thread.comments)) {
        const comment = thread.comments.find((c) => c.id === commentId);
        if (!comment) return;

        state.voteOptimisticComment[action.meta.requestId] = {
          threadId,
          commentId,
          userId,
          prev: {
            up: comment.upVotesBy.includes(userId),
            down: comment.downVotesBy.includes(userId),
          },
        };

        comment.upVotesBy = removeUserFromVote(comment.upVotesBy, userId);
        addUniqueVote(comment.downVotesBy, userId);
      }
    });
    builder.addCase(handleDownVoteComment.fulfilled, (state, action) => {
      state.downVoteCommentStatus = FETCH_STATUS.succeeded;
      delete state.voteOptimisticComment[action.meta.requestId];

      const { threadId, commentId } = action.meta.arg;
      if (state.voteInFlightByCommentId[commentId] === action.meta.requestId) {
        state.voteInFlightByCommentId[commentId] = null;
      }

      const thread = state.entities[threadId];
      if (!thread) return;

      if (Array.isArray(thread.comments)) {
        const comment = thread.comments.find((c) => c.id === commentId);
        if (!comment) return;

        const { userId } = action.payload.data.vote;
        comment.upVotesBy = removeUserFromVote(comment.upVotesBy, userId);
        addUniqueVote(comment.downVotesBy, userId);
      }
    });
    builder.addCase(handleDownVoteComment.rejected, (state, action) => {
      state.downVoteCommentStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;

      const { commentId } = action.meta.arg;
      if (state.voteInFlightByCommentId[commentId] === action.meta.requestId) {
        state.voteInFlightByCommentId[commentId] = null;
      }

      const snap = state.voteOptimisticComment[action.meta.requestId];
      delete state.voteOptimisticComment[action.meta.requestId];
      if (!snap) return;

      const thread = state.entities[snap.threadId];
      if (!thread) return;

      if (Array.isArray(thread.comments)) {
        const comment = thread.comments.find((c) => c.id === commentId);
        if (!comment) return;

        // rollback
        comment.upVotesBy = removeUserFromVote(comment.upVotesBy, snap.userId);
        comment.downVotesBy = removeUserFromVote(comment.downVotesBy, snap.userId);

        if (snap.prev.up) addUniqueVote(comment.upVotesBy, snap.userId);
        if (snap.prev.down) addUniqueVote(comment.downVotesBy, snap.userId);
      }
    });

    // handleNeutralVoteComment
    builder.addCase(handleNeutralVoteComment.pending, (state, action) => {
      state.neutralVoteCommentStatus = FETCH_STATUS.loading;
      state.error = null;

      const { threadId, userId, commentId } = action.meta.arg;
      state.voteInFlightByCommentId[commentId] = action.meta.requestId;

      const thread = state.entities[threadId];
      if (!thread) return;

      if (Array.isArray(thread.comments)) {
        const comment = thread.comments.find((c) => c.id === commentId);
        if (!comment) return;

        state.voteOptimisticComment[action.meta.requestId] = {
          threadId,
          commentId,
          userId,
          prev: {
            up: comment.upVotesBy.includes(userId),
            down: comment.downVotesBy.includes(userId),
          },
        };

        comment.upVotesBy = removeUserFromVote(comment.upVotesBy, userId);
        comment.downVotesBy = removeUserFromVote(comment.downVotesBy, userId);
      }
    });
    builder.addCase(handleNeutralVoteComment.fulfilled, (state, action) => {
      state.neutralVoteCommentStatus = FETCH_STATUS.succeeded;
      delete state.voteOptimisticComment[action.meta.requestId];

      const { threadId, commentId } = action.meta.arg;
      if (state.voteInFlightByCommentId[commentId] === action.meta.requestId) {
        state.voteInFlightByCommentId[commentId] = null;
      }

      const thread = state.entities[threadId];
      if (!thread) return;

      if (Array.isArray(thread.comments)) {
        const comment = thread.comments.find((c) => c.id === commentId);
        if (!comment) return;

        const { userId } = action.payload.data.vote;
        comment.upVotesBy = removeUserFromVote(comment.upVotesBy, userId);
        comment.downVotesBy = removeUserFromVote(comment.downVotesBy, userId);
      }
    });
    builder.addCase(handleNeutralVoteComment.rejected, (state, action) => {
      state.neutralVoteCommentStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;

      const { commentId } = action.meta.arg;
      if (state.voteInFlightByCommentId[commentId] === action.meta.requestId) {
        state.voteInFlightByCommentId[commentId] = null;
      }

      const snap = state.voteOptimisticComment[action.meta.requestId];
      delete state.voteOptimisticComment[action.meta.requestId];
      if (!snap) return;

      const thread = state.entities[snap.threadId];
      if (!thread) return;

      if (Array.isArray(thread.comments)) {
        const comment = thread.comments.find((c) => c.id === commentId);
        if (!comment) return;

        // rollback
        comment.upVotesBy = removeUserFromVote(comment.upVotesBy, snap.userId);
        comment.downVotesBy = removeUserFromVote(comment.downVotesBy, snap.userId);

        if (snap.prev.up) addUniqueVote(comment.upVotesBy, snap.userId);
        if (snap.prev.down) addUniqueVote(comment.downVotesBy, snap.userId);
      }
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
