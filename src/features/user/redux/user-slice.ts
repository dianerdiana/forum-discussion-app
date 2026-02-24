import { type PayloadAction, createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import { api } from '@/configs/api-config';
import { toApiError } from '@/configs/auth/jwt-service';
import type { RootState } from '@/redux/store';
import type { User } from '@/types/user-type';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

type UserState = {
  selectedId: string | null;
  me: User | null;

  preloadStatus: string;
  listStatus: string;

  error: unknown | null;
};

// Entity Adapter
const usersAdapter = createEntityAdapter<User>();

const initialState = usersAdapter.getInitialState<UserState>({
  selectedId: null,
  me: null,

  preloadStatus: FETCH_STATUS.idle,
  listStatus: FETCH_STATUS.idle,
  error: null,
});

type ThunkUserArgs = {
  showGlobalLoading?: boolean; // default true
  force?: boolean; // kalau mau bypass cache/condition
};

// Thunks
export const getUsers = createAsyncThunk<User[], ThunkUserArgs | void, { state: RootState; rejectValue: unknown }>(
  'users/getUsers',
  async (_arg, thunkApi) => {
    try {
      const response = await api.get('/users');
      return response.data.data.users as User[];
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState();
      const { listStatus, ids } = state.users;

      const force = (arg as ThunkUserArgs | undefined)?.force === true;

      if (force) return true;
      if (listStatus === FETCH_STATUS.loading) return false;

      const hasData = ids.length > 0;
      if (listStatus === FETCH_STATUS.succeeded && hasData) return false;

      return true;
    },
  },
);

export const getOwnProfile = createAsyncThunk<User, ThunkUserArgs | void, { state: RootState; rejectValue: unknown }>(
  'users/getOwnProfile',
  async (_arg, thunkApi) => {
    try {
      const response = await api.get(`/users/me`);
      return response.data.data.user as User;
    } catch (error) {
      return thunkApi.rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState();
      const { preloadStatus } = state.users;

      const force = arg?.force === true;
      if (force) return true;

      if (preloadStatus === FETCH_STATUS.loading) return false;

      const existing = state.users.me;
      if (existing) return false;

      return true;
    },
  },
);

// Slice
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    clearUserError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    // getUsers
    builder.addCase(getUsers.pending, (state) => {
      state.listStatus = FETCH_STATUS.loading;
      state.error = null;
    });
    builder.addCase(getUsers.fulfilled, (state, action) => {
      state.listStatus = FETCH_STATUS.succeeded;
      usersAdapter.setAll(state, action.payload);
    });
    builder.addCase(getUsers.rejected, (state, action) => {
      state.listStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;
    });

    // getOwnProfile
    builder.addCase(getOwnProfile.pending, (state) => {
      state.preloadStatus = FETCH_STATUS.loading;
      state.error = null;
    });
    builder.addCase(getOwnProfile.fulfilled, (state, action) => {
      state.preloadStatus = FETCH_STATUS.succeeded;
      state.me = action.payload;
    });
    builder.addCase(getOwnProfile.rejected, (state, action) => {
      state.preloadStatus = FETCH_STATUS.failed;
      state.error = action.payload ?? action.error;
      api.removeToken();
    });
  },
});

export const { setSelectedUser, clearUserError } = userSlice.actions;

export default userSlice.reducer;

// ===== Selectors (entity adapter selectors)
export const userSelectors = usersAdapter.getSelectors<RootState>((state) => state.users);
export const selectUsersListStatus = (state: RootState) => state.users.listStatus;
export const selectPreloadStatus = (state: RootState) => state.users.preloadStatus;
export const selectOwnProfile = (state: RootState) => state.users.me;

export const selectSelectedUser = (state: RootState) => {
  const id = state.users.selectedId;
  return id ? (state.users.entities[id] ?? null) : null;
};
