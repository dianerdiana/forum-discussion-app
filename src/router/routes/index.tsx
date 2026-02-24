import { lazy } from 'react';

import type { AppRoute } from '@/types/route-type';

import HomePage from '../../pages';

const LoginPage = lazy(() => import('../../pages/login.tsx'));
const RegisterPage = lazy(() => import('../../pages/register.tsx'));

const CreateThreadPage = lazy(() => import('../../pages/threads/create.tsx'));
const DetailThreadPage = lazy(() => import('../../pages/threads/details.tsx'));

const routes: AppRoute[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/threads/create',
    element: <CreateThreadPage />,
  },
  {
    path: '/threads/:id/details',
    element: <DetailThreadPage />,
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
