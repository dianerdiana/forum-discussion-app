import { lazy } from 'react';

import type { AppRoute } from '@/types/route-type';

import HomePage from '../../pages';

const LoginPage = lazy(() => import('../../pages/login.tsx'));
const RegisterPage = lazy(() => import('../../pages/register.tsx'));

const routes: AppRoute[] = [
  {
    path: '/home',
    element: <HomePage />,
    meta: {
      layout: 'blank',
      publicRoute: true,
    },
  },
  {
    path: '/login',
    element: <LoginPage />,
    meta: {
      layout: 'blank',
      publicRoute: true,
    },
  },
  {
    path: '/register',
    element: <RegisterPage />,
    meta: {
      layout: 'blank',
      publicRoute: true,
    },
  },
];

export default routes;
