import type { AppRoute } from '@/types/route-type';

import HomePage from '../../pages';

const routes: AppRoute[] = [
  {
    path: '/home',
    element: <HomePage />,
    meta: {
      layout: 'blank',
      publicRoute: true,
    },
  },
];

export default routes;
