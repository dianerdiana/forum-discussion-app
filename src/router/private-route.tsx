import { Suspense, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import FallbackSpinner from '@/components/fallback-spinner';
import { getOwnProfile, selectPreloadStatus } from '@/features/user/redux/user-slice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import type { RouteMeta } from '@/types/route-type';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';
import { useAuth } from '@/utils/hooks/use-auth';
import { getHomeRouteForLoggedInUser, getUserData } from '@/utils/utils';

type PrivateRouteProps = {
  children: React.ReactNode;
  routeMeta?: RouteMeta;
};

export const PrivateRoute = ({ children, routeMeta = { restricted: false } }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const dispatch = useAppDispatch();
  const preloadStatus = useAppSelector(selectPreloadStatus);

  const restricted = routeMeta?.restricted;

  const userData = getUserData();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getOwnProfile({ showGlobalLoading: false }));
    }
  }, [dispatch, isAuthenticated]);

  if (isLoading) {
    return <FallbackSpinner />;
  }

  if (!isAuthenticated || preloadStatus === FETCH_STATUS.failed) {
    return <Navigate to='/login' />;
  }

  if (isAuthenticated && restricted) {
    return <Navigate to={getHomeRouteForLoggedInUser(userData.role)} />;
  }

  return <Suspense fallback={<FallbackSpinner />}>{children}</Suspense>;
};
