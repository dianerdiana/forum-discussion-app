import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/redux/auth-slice';
import threadReducer from '../features/thread/redux/thread-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    threads: threadReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
