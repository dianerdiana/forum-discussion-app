import * as React from 'react';

import { Progress } from './ui/progress';

type Props = {
  isLoading: boolean;
};

export const TopLoadingBar = ({ isLoading }: Props) => {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    let incTimer: number | undefined;
    let doneTimer: number | undefined;

    if (isLoading) {
      // minimal muncul, lalu naik pelan sampai 90
      setValue((v) => (v === 0 ? 10 : v));

      incTimer = window.setInterval(() => {
        setValue((v) => {
          const next = v + Math.random() * 12;
          return next >= 90 ? 90 : next;
        });
      }, 250);
    } else {
      // selesai: ke 100 lalu hilang
      setValue((v) => (v === 0 ? 0 : 100));
      doneTimer = window.setTimeout(() => setValue(0), 250);
    }

    return () => {
      if (incTimer) window.clearInterval(incTimer);
      if (doneTimer) window.clearTimeout(doneTimer);
    };
  }, [isLoading]);

  if (value === 0) return null;

  return (
    <div className='fixed left-0 top-0 z-50 w-full'>
      <Progress value={value} className='h-1 rounded-none' />
    </div>
  );
};
