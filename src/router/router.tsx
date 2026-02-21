import { lazy } from 'react';
import { type RouteObject, createBrowserRouter, redirect } from 'react-router-dom';

// Layouts
import BlankLayout from '@/layouts/blank-layout.tsx';
import type { AppRoute, RouteMeta } from '@/types/route-type';

import { PrivateRoute } from './private-route.tsx';
import { PublicRoute } from './public-route.tsx';
import routes from './routes';

const VerticalLayout = lazy(() => import('../layouts/blank-layout.tsx'));
const LazyApp = lazy(() => import('../App.tsx'));

const resolveLayout = (layout?: string) => {
  switch (layout) {
    case 'blank':
      return BlankLayout;
    case 'vertical':
      return VerticalLayout;
    default:
      return VerticalLayout;
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
  const defaultLayout = 'vertical';
  const layouts = ['vertical', 'blank'];

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
    path: '/',
    index: true,
    loader: () => redirect('/signin'),
  },
  {
    Component: LazyApp,
    children: [...getRoutes()],
  },
]);
