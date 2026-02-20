Berikut contoh implementasi **best practice** `createSlice` + `createAsyncThunk` pakai **TypeScript** (pattern yang umum dipakai di Redux Toolkit): **typed thunk API**, **error handling pakai `rejectWithValue`**, **selector**, dan **state machine sederhana (idle/loading/succeeded/failed)**.

## 1) `services/usersApi.ts` (layer API)

```ts
// services/usersApi.ts
export type User = {
  id: string;
  name: string;
  email: string;
};

export type ApiError = {
  message: string;
  status?: number;
};

// contoh fetch wrapper sederhana
async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    // ambil payload error jika ada
    let msg = 'Request failed';
    try {
      const data = (await res.json()) as { message?: string };
      msg = data.message ?? msg;
    } catch {
      // ignore
    }
    const err: ApiError = { message: msg, status: res.status };
    throw err;
  }

  return (await res.json()) as T;
}

export const usersApi = {
  list: () => request<User[]>('/api/users'),
  create: (payload: { name: string; email: string }) =>
    request<User>('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
};
```

## 2) `app/store.ts` (typed store)

```ts
// app/store.ts
import { configureStore } from '@reduxjs/toolkit';

import usersReducer from '../features/users/usersSlice';

export const store = configureStore({
  reducer: {
    users: usersReducer,
  },
});

// typed hooks / types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## 3) `features/users/usersSlice.ts` (slice + thunks)

```ts
// features/users/usersSlice.ts
import { type PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { RootState } from '../../app/store';
import { type ApiError, type User, usersApi } from '../../services/usersApi';

// status enum biar ketat
type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type UsersState = {
  items: User[];
  status: RequestStatus;
  error: string | null;
  creatingStatus: RequestStatus;
  creatingError: string | null;
};

const initialState: UsersState = {
  items: [],
  status: 'idle',
  error: null,
  creatingStatus: 'idle',
  creatingError: null,
};

// 1) Thunk: fetch list users
export const fetchUsers = createAsyncThunk<
  // Return type
  User[],
  // Arg type
  void,
  // ThunkAPI config: rejectValue, state, etc.
  { state: RootState; rejectValue: string }
>('users/fetchUsers', async (_arg, thunkApi) => {
  try {
    const data = await usersApi.list();
    return data;
  } catch (e) {
    const err = e as ApiError;
    return thunkApi.rejectWithValue(err.message ?? 'Failed to fetch users');
  }
});

// 2) Thunk: create user
export const createUser = createAsyncThunk<
  User,
  { name: string; email: string },
  { state: RootState; rejectValue: string }
>('users/createUser', async (payload, thunkApi) => {
  try {
    const created = await usersApi.create(payload);
    return created;
  } catch (e) {
    const err = e as ApiError;
    return thunkApi.rejectWithValue(err.message ?? 'Failed to create user');
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // contoh reducer sync
    resetUsersState: () => initialState,
    clearErrors: (state) => {
      state.error = null;
      state.creatingError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchUsers
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        // karena kita pakai rejectWithValue<string>, payload bisa string
        state.error = action.payload ?? action.error.message ?? 'Unknown error';
      });

    // createUser
    builder
      .addCase(createUser.pending, (state) => {
        state.creatingStatus = 'loading';
        state.creatingError = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.creatingStatus = 'succeeded';
        // best practice: update local cache list
        state.items.unshift(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.creatingStatus = 'failed';
        state.creatingError = action.payload ?? action.error.message ?? 'Unknown error';
      });
  },
});

export const { resetUsersState, clearErrors } = usersSlice.actions;

// selectors (best practice: export selector terpisah)
export const selectUsers = (state: RootState) => state.users.items;
export const selectUsersStatus = (state: RootState) => state.users.status;
export const selectUsersError = (state: RootState) => state.users.error;

export const selectCreatingStatus = (state: RootState) => state.users.creatingStatus;
export const selectCreatingError = (state: RootState) => state.users.creatingError;

export default usersSlice.reducer;
```

## 4) Typed hooks untuk React (`app/hooks.ts`)

```ts
// app/hooks.ts
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## 5) Contoh pemakaian di component

```tsx
import React, { useEffect, useState } from 'react';

import {
  createUser,
  fetchUsers,
  selectCreatingError,
  selectCreatingStatus,
  selectUsers,
  selectUsersError,
  selectUsersStatus,
} from './usersSlice';

import { useAppDispatch, useAppSelector } from '../../app/hooks';

export function UsersPage() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const status = useAppSelector(selectUsersStatus);
  const error = useAppSelector(selectUsersError);
  const creatingStatus = useAppSelector(selectCreatingStatus);
  const creatingError = useAppSelector(selectCreatingError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  const onCreate = async () => {
    const res = await dispatch(createUser({ name, email }));
    if (createUser.fulfilled.match(res)) {
      setName('');
      setEmail('');
    }
    // kalau rejected, error sudah tersimpan di state.creatingError
  };

  return (
    <div>
      <h1>Users</h1>

      {status === 'loading' && <p>Loading...</p>}
      {status === 'failed' && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name} — {u.email}
          </li>
        ))}
      </ul>

      <h2>Create User</h2>
      {creatingStatus === 'loading' && <p>Creating...</p>}
      {creatingStatus === 'failed' && <p style={{ color: 'red' }}>{creatingError}</p>}

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder='name' />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder='email' />
      <button onClick={onCreate} disabled={creatingStatus === 'loading'}>
        Create
      </button>
    </div>
  );
}
```

## Checklist best practice yang dipakai di atas

- **Pisahkan API layer** (`services/...`) dari slice.
- `createAsyncThunk` pakai **generic types** + **`rejectWithValue`** untuk error typed.
- State pakai **status machine** dan **error field** yang jelas.
- Export **selectors** dari slice.
- Gunakan **typed hooks** (`useAppDispatch`, `useAppSelector`) supaya TS inference rapi.
- Update cache local (mis. `items.unshift`) setelah create.

Kalau kamu mau, aku bisa adapt contoh ini ke struktur project kamu (mis. Vite + RTK + axios + token auth + refresh token) atau ke pattern yang lebih “enterprise” (normalization via `createEntityAdapter`, pagination, dan request deduping).
