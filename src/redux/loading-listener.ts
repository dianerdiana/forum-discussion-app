import { createListenerMiddleware } from '@reduxjs/toolkit';

import { requestFinished, requestStarted } from './ui-slice';

// match semua action thunk yang berakhiran /pending /fulfilled /rejected
const isPending = (action: any) => typeof action.type === 'string' && action.type.endsWith('/pending');
const isFulfilled = (action: any) => typeof action.type === 'string' && action.type.endsWith('/fulfilled');
const isRejected = (action: any) => typeof action.type === 'string' && action.type.endsWith('/rejected');

const shouldCountForGlobalLoading = (action: any) => {
  const arg = action?.meta?.arg;

  // thunk tanpa arg => hitung (true)
  if (!arg) return true;

  // kalau arg object punya showGlobalLoading:false => skip
  if (typeof arg === 'object' && 'showGlobalLoading' in arg) {
    return arg.showGlobalLoading !== false;
  }

  return true;
};

export const loadingListener = createListenerMiddleware();

loadingListener.startListening({
  predicate: (action) => isPending(action) && shouldCountForGlobalLoading(action),
  effect: async (_action, api) => {
    api.dispatch(requestStarted());
  },
});

loadingListener.startListening({
  predicate: (action) => (isFulfilled(action) || isRejected(action)) && shouldCountForGlobalLoading(action),
  effect: async (_action, api) => {
    api.dispatch(requestFinished());
  },
});
