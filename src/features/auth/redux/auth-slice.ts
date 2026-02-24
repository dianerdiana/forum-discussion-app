import { type PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { api } from '@/configs/api-config';
import { toApiError } from '@/configs/auth/jwt-service';

import type { LoginDataType } from '../types/login-type';

type AuthState = {
  token: string | null;
  status: string;
};

const initialState: AuthState = {
  token: api.getToken(),
  status: 'idle',
};

export const login = createAsyncThunk('app/handleLogin', async (data: LoginDataType, thunkApi) => {
  try {
    const response = await api.login(data);
    return response.data;
  } catch (error) {
    const apiErr = toApiError(error);
    return thunkApi.rejectWithValue(apiErr);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    handleLogin: (state, action) => {
      state.token = action.payload;
      api.setToken(action.payload);
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      if (action.payload) api.setToken(action.payload);
      else api.removeToken();
    },
    handleLogout(state) {
      state.token = null;
      api.removeToken();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload;
        api.setToken(action.payload);
        state.status = 'success';

        console.log(action.payload);
      });
  },
});

export const { setToken, handleLogin, handleLogout } = authSlice.actions;

export default authSlice.reducer;
