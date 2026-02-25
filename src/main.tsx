import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

import FallbackSpinner from './components/fallback-spinner.tsx';
import { Toaster } from './components/ui/sonner.tsx';
import './index.css';
import { store } from './redux/store.ts';
import { router } from './router/router.tsx';
import { AuthContextProvider } from './utils/context/auth-context.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthContextProvider>
        <Suspense fallback={<FallbackSpinner />}>
          <RouterProvider router={router} />
          <Toaster position='top-right' />
        </Suspense>
      </AuthContextProvider>
    </Provider>
  </StrictMode>,
);
