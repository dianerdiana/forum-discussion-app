import { describe, expect, it } from 'vitest';

import reducer, { requestFinished, requestStarted, resetRequests, selectIsGlobalLoading } from '../ui-slice';

function getInitialState() {
  return reducer(undefined, { type: '@@INIT' });
}

describe('ui slice - reducer', () => {
  it('should return the initial state', () => {
    const initialState = getInitialState();

    expect(initialState.pendingRequests).toBe(0);
  });

  describe('requestStarted', () => {
    it('should increment pendingRequests by 1', () => {
      const initialState = getInitialState();

      const nextState = reducer(initialState, requestStarted());

      expect(nextState.pendingRequests).toBe(1);
    });

    it('should increment pendingRequests multiple times', () => {
      const initialState = getInitialState();

      const s1 = reducer(initialState, requestStarted());
      const s2 = reducer(s1, requestStarted());
      const s3 = reducer(s2, requestStarted());

      expect(s3.pendingRequests).toBe(3);
    });
  });

  describe('requestFinished', () => {
    it('should decrement pendingRequests by 1', () => {
      const initialState = getInitialState();

      const started = reducer(initialState, requestStarted()); // 1
      const nextState = reducer(started, requestFinished()); // 0

      expect(nextState.pendingRequests).toBe(0);
    });

    it('should never go below 0', () => {
      const initialState = getInitialState();

      const nextState = reducer(initialState, requestFinished());

      expect(nextState.pendingRequests).toBe(0);
    });

    it('should clamp at 0 even if called more times than started', () => {
      const initialState = getInitialState();

      const startedTwice = reducer(reducer(initialState, requestStarted()), requestStarted()); // 2
      const s1 = reducer(startedTwice, requestFinished()); // 1
      const s2 = reducer(s1, requestFinished()); // 0
      const s3 = reducer(s2, requestFinished()); // still 0

      expect(s3.pendingRequests).toBe(0);
    });
  });

  describe('resetRequests', () => {
    it('should set pendingRequests to 0', () => {
      const initialState = getInitialState();

      const started = reducer(reducer(initialState, requestStarted()), requestStarted()); // 2
      const nextState = reducer(started, resetRequests());

      expect(nextState.pendingRequests).toBe(0);
    });
  });

  describe('selector (selectIsGlobalLoading)', () => {
    it('should return false when pendingRequests is 0', () => {
      const state = { ui: getInitialState() };

      expect(selectIsGlobalLoading(state)).toBe(false);
    });

    it('should return true when pendingRequests is > 0', () => {
      const uiState = reducer(getInitialState(), requestStarted());

      expect(selectIsGlobalLoading({ ui: uiState })).toBe(true);
    });
  });
});
