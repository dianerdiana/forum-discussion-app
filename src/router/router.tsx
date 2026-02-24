import { lazy } from 'react';
import { type RouteObject, createBrowserRouter, redirect } from 'react-router-dom';

import BlankLayout from '@/layouts/blank-layout.tsx';
import NavigationLayout from '@/layouts/navigation-layout.tsx';
import type { AppRoute, RouteMeta } from '@/types/route-type';

import { PrivateRoute } from './private-route.tsx';
import { PublicRoute } from './public-route.tsx';
import routes from './routes';

const LazyApp = lazy(() => import('../App.tsx'));

const resolveLayout = (layout?: string) => {
  switch (layout) {
    case 'blank':
      return BlankLayout;
    case 'navigation':
      return NavigationLayout;
    default:
      return BlankLayout;
  }
};

const mergeLayoutRoutes = (layout: string, defaultLayout: string): AppRoute[] => {
  const LayoutRoutes: AppRoute[] = [];

  routes.forEach((route) => {
    const isMatch =
      (route.meta && route.meta.layout === layout) ||
      route.meta === undefined ||
      (route.meta?.layout === undefined && defaultLayout === layout);

    if (isMatch) {
      let RouteTag: React.ElementType = PrivateRoute;

      if (route.meta) {
        RouteTag = route.meta.publicRoute ? PublicRoute : PrivateRoute;
      }

      if (route.element) {
        const newRoute = {
          ...route,
          element: <RouteTag routeMeta={route.meta}>{route.element}</RouteTag>,
          handle: {
            ...route.meta,
          } satisfies RouteMeta,
        };

        LayoutRoutes.push(newRoute);
      }
    }
  });

  return LayoutRoutes;
};

const getRoutes = () => {
  const defaultLayout = 'navigation';
  const layouts = ['navigation', 'blank'];

  const AllRoutes: RouteObject[] = [];

  layouts.forEach((layoutItem) => {
    const LayoutRoutes = mergeLayoutRoutes(layoutItem, defaultLayout);

    AllRoutes.push({
      Component: resolveLayout(layoutItem) || resolveLayout(defaultLayout),
      children: LayoutRoutes,
    });
  });
  return AllRoutes;
};

export const router = createBrowserRouter([
  {
    path: '/threads',
    index: true,
    loader: () => redirect('/'),
  },
  {
    Component: LazyApp,
    children: [...getRoutes()],
  },
]);
