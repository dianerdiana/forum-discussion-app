import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import FallbackSpinner from './components/fallback-spinner.tsx';
import './index.css';
import { router } from './router/router.tsx';
import { AuthContextProvider } from './utils/context/auth-context.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthContextProvider>
      <Suspense fallback={<FallbackSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthContextProvider>
  </StrictMode>,
);
