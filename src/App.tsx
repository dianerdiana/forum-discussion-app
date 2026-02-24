import { Suspense, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';

import { TopLoadingBar } from './components/top-loading-bar';
import { getOwnProfile, selectPreloadStatus } from './features/user/redux/user-slice';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { selectIsGlobalLoading } from './redux/ui-slice';
import { FETCH_STATUS } from './utils/constants/fetch-status';

function App() {
  const [isMounted, setIsMounted] = useState(false);

  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsGlobalLoading);
  const preloadStatus = useAppSelector(selectPreloadStatus);

  useEffect(() => {
    setIsMounted(true);
    dispatch(getOwnProfile());

    return () => setIsMounted(false);
  }, []);

  if (!isMounted || preloadStatus === FETCH_STATUS.idle || preloadStatus === FETCH_STATUS.loading) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <TopLoadingBar isLoading={isLoading} />
      <Outlet />
      <ScrollRestoration />
    </Suspense>
  );
}

export default App;
