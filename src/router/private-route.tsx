import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import FallbackSpinner from '@/components/fallback-spinner';
import { selectPreloadStatus } from '@/features/user/redux/user-slice';
import { useAppSelector } from '@/redux/hooks';
import type { RouteMeta } from '@/types/route-type';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';
import { useAuth } from '@/utils/hooks/use-auth';

type PrivateRouteProps = {
  children: React.ReactNode;
  routeMeta?: RouteMeta;
};

export const PrivateRoute = ({ children, routeMeta = { restricted: false } }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const preloadStatus = useAppSelector(selectPreloadStatus);

  const restricted = routeMeta?.restricted;

  if (isLoading) {
    return <FallbackSpinner />;
  }

  if (!isAuthenticated || preloadStatus === FETCH_STATUS.failed) {
    return <Navigate to='/login' />;
  }

  if (isAuthenticated && restricted) {
    return <Navigate to='/' />;
  }

  return <Suspense fallback={<FallbackSpinner />}>{children}</Suspense>;
};
