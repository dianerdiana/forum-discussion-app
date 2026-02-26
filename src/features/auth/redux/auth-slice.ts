import { createSlice } from '@reduxjs/toolkit';

import { api } from '@/configs/api-config';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

type AuthState = {
  token: string | null;
  status: string;
};

const initialState: AuthState = {
  token: api.getToken(),
  status: FETCH_STATUS.idle,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    handleLogin: (state, action) => {
      state.token = action.payload;
      api.setToken(action.payload);
    },
    handleLogout(state) {
      state.token = null;
      api.removeToken();
    },
  },
});

export const { handleLogin, handleLogout } = authSlice.actions;

export default authSlice.reducer;
