import { Link, useLocation } from 'react-router';

import { ChessQueen, CirclePlus, MessagesSquare, Power } from 'lucide-react';

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
    icon: ChessQueen,
    href: '/leaderboard',
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
    <nav className='fixed inset-x-0 bottom-0 max-w-160 z-50 bg-white shadow-sm mx-auto'>
      <ul className='flex items-center justify-between px-8 py-4'>
        {navigation.map((nav) => (
          <li key={nav.id}>
            <Link
              to={`${nav.href}`}
              className={cn('flex flex-col items-center gap-2', nav.href === pathname && 'text-primary')}
            >
              <div className='relative'>
                <nav.icon
                  className={nav.href === pathname ? 'stroke-primary fill-primary' : 'stroke-muted-foreground'}
                />
              </div>
              <p className='font-normal text-xs'>{nav.name}</p>
            </Link>
          </li>
        ))}
        <li>
          <Link onClick={() => dispatch(handleLogout())} className='flex flex-col items-center gap-2' to='/login'>
            <div className='relative'>
              <Power className='stroke-muted-foreground' />
            </div>
            <p className='font-normal text-xs'>Logout</p>
          </Link>
        </li>
      </ul>
    </nav>
  );
};
