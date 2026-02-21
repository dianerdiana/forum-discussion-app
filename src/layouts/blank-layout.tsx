import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

const BlankLayout = () => {
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  );
};

export default BlankLayout;
