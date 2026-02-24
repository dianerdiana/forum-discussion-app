import { configureStore } from '@reduxjs/toolkit';

import { loadingListener } from './loading-listener';
import uiReducer from './ui-slice';

import authReducer from '../features/auth/redux/auth-slice';
import leaderboardSlice from '../features/leaderboard/redux/leaderboard-slice';
import threadReducer from '../features/thread/redux/thread-slice';
import userReducer from '../features/user/redux/user-slice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    threads: threadReducer,
    users: userReducer,
    leaderboards: leaderboardSlice,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).prepend(loadingListener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
