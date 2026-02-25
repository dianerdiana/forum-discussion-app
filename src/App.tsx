import { Suspense, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';

import { TopLoadingBar } from './components/top-loading-bar';
import { useAppSelector } from './redux/hooks';
import { selectIsGlobalLoading } from './redux/ui-slice';

function App() {
  const [isMounted, setIsMounted] = useState(false);

  const isLoading = useAppSelector(selectIsGlobalLoading);

  useEffect(() => {
    setIsMounted(true);

    return () => setIsMounted(false);
  }, []);

  if (!isMounted) {
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
