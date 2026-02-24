import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { api } from '@/configs/api-config';
import { toApiError } from '@/configs/auth/jwt-service';
import type { RootState } from '@/redux/store';
import type { Leaderboard } from '@/types/leaderboard-type';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

type LeaderboardState = {
  items: Leaderboard[];
  listStatus: string;
  error: unknown | null;
};

const initialState: LeaderboardState = {
  items: [],
  listStatus: FETCH_STATUS.idle,
  error: null,
};

type ThunkLeaderboardArgs = {
  showGlobalLoading?: boolean; // default true
  force?: boolean; // kalau mau bypass cache/condition
};

// Thunks
export const getLeaderboards = createAsyncThunk<
  Leaderboard[],
  ThunkLeaderboardArgs | void,
  { state: RootState; rejectValue: unknown }
>(
  'leaderboards/getLeaderboards',
  async (_arg, thunkApi) => {
    try {
      const response = await api.get('/leaderboards');
      return response.data.data.leaderboards as Leaderboard[];
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState();
      const { listStatus, items } = state.leaderboards;

      const force = arg?.force === true;

      if (force) return true;
      if (listStatus === FETCH_STATUS.loading) return false;

      const hasData = items.length > 0;
      if (listStatus === FETCH_STATUS.succeeded && hasData) return false;

      return true;
    },
  },
);

// Slice
const leaderboardSlice = createSlice({
  name: 'leaderboards',
  initialState,
  reducers: {
    clearLeaderboardError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    // getLeaderboards
    builder.addCase(getLeaderboards.pending, (state) => {
      state.listStatus = FETCH_STATUS.loading;
      state.error = null;
    });
    builder.addCase(getLeaderboards.fulfilled, (state, action) => {
      state.listStatus = FETCH_STATUS.succeeded;
      state.items = action.payload;
    });
    builder.addCase(getLeaderboards.rejected, (state, action) => {
      state.listStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;
    });
  },
});

export const { clearLeaderboardError } = leaderboardSlice.actions;

export default leaderboardSlice.reducer;

export const selectLeaderboardsListStatus = (state: RootState) => state.leaderboards.listStatus;
export const selectAllLeaderboards = (state: RootState) => state.leaderboards.items;
