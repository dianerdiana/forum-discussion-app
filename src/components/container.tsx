import type React from 'react';

import { cn } from '@/utils/utils';

export const Container = ({ className, children, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div className={cn('flex flex-col w-full max-w-160 mx-auto', className)} {...props}>
      {children}
    </div>
  );
};
