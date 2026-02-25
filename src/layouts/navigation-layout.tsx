import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { NavigationBottom } from '@/components/navigation-bottom';

const NavigationLayout = () => (
    <Suspense fallback={null}>
      <Outlet />

      <footer>
        <NavigationBottom />
      </footer>
    </Suspense>
  );

export default NavigationLayout;
