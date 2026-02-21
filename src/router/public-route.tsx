import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import type { RouteMeta } from '@/types/route-type';
import { useAuth } from '@/utils/hooks/use-auth';

type PublicRouteProps = {
  children: React.ReactNode;
  routeMeta: RouteMeta;
};

export const PublicRoute = ({ children, routeMeta }: PublicRouteProps) => {
  const { isAuthenticated } = useAuth();
  let restrictedRoute = false;

  if (routeMeta) {
    restrictedRoute = routeMeta.restricted || false;
  }

  if (isAuthenticated && restrictedRoute) {
    return <Navigate to='/dashboard' />;
  }

  return <Suspense fallback={null}>{children}</Suspense>;
};
