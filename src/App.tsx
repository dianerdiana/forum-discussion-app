import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';

import { TopLoadingBar } from './components/top-loading-bar';
import { useAppSelector } from './redux/hooks';
import { selectIsGlobalLoading } from './redux/ui-slice';

const App = () => {
  const isLoading = useAppSelector(selectIsGlobalLoading);

  return (
    <Suspense fallback={null}>
      <TopLoadingBar isLoading={isLoading} />
      <Outlet />
      <ScrollRestoration />
    </Suspense>
  );
};

export default App;
