import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import FallbackSpinner from '@/components/fallback-spinner';
import type { RouteMeta } from '@/types/route-type';
import { useAuth } from '@/utils/hooks/use-auth';
import { getHomeRouteForLoggedInUser, getUserData } from '@/utils/utils';

type PrivateRouteProps = {
  children: React.ReactNode;
  routeMeta?: RouteMeta;
};

export const PrivateRoute = ({ children, routeMeta }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  const restricted = routeMeta?.restricted || false;

  const userData = getUserData();

  if (isLoading) {
    return <FallbackSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' />;
  }

  if (isAuthenticated && restricted) {
    return <Navigate to={getHomeRouteForLoggedInUser(userData.role)} />;
  }

  return <Suspense fallback={<FallbackSpinner />}>{children}</Suspense>;
};
