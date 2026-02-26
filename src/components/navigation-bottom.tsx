import { Link, useLocation } from 'react-router-dom';

import { CirclePlus, Crown, MessagesSquare, Power } from 'lucide-react';

import { handleLogout } from '@/features/auth/redux/auth-slice';
import { useAppDispatch } from '@/redux/hooks';
import { cn } from '@/utils/utils';

const navigation = [
  {
    id: '1',
    name: 'Threads',
    icon: MessagesSquare,
    href: '/',
  },
  {
    id: '2',
    name: 'Leaderboard',
    icon: Crown,
    href: '/leaderboards',
  },
  {
    id: '3',
    name: 'Post',
    icon: CirclePlus,
    href: '/threads/create',
  },
];

export const NavigationBottom = () => {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();

  return (
    <nav className='fixed inset-x-0 bottom-0 max-w-160 z-50 bg-accent shadow-sm mx-auto rounded-t-2xl'>
      <ul className='flex items-center justify-between px-8 py-4'>
        {navigation.map((nav) => (
          <li key={nav.id}>
            <Link
              to={`${nav.href}`}
              className={cn(
                'flex flex-col items-center gap-2 text-foreground',
                nav.href === pathname && 'text-primary',
              )}
            >
              <div className='relative'>
                <nav.icon className={nav.href === pathname ? 'stroke-primary fill-primary' : 'stroke-foreground'} />
              </div>
              <p className='font-normal text-xs'>{nav.name}</p>
            </Link>
          </li>
        ))}
        <li>
          <Link onClick={() => dispatch(handleLogout())} className='flex flex-col items-center gap-2' to='/login'>
            <div className='relative'>
              <Power className='stroke-foreground' />
            </div>
            <p className='font-normal text-xs'>Logout</p>
          </Link>
        </li>
      </ul>
    </nav>
  );
};
