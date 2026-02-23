import { createSlice } from '@reduxjs/toolkit';

type UiState = {
  pendingRequests: number; // counter
};

const initialState: UiState = {
  pendingRequests: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    requestStarted(state) {
      state.pendingRequests += 1;
    },
    requestFinished(state) {
      state.pendingRequests = Math.max(0, state.pendingRequests - 1);
    },
    resetRequests(state) {
      state.pendingRequests = 0;
    },
  },
});

export const { requestStarted, requestFinished, resetRequests } = uiSlice.actions;

export const selectIsGlobalLoading = (state: { ui: UiState }) => state.ui.pendingRequests > 0;

export default uiSlice.reducer;
