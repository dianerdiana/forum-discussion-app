import { useLocation } from 'react-router';

import { ChessQueen, MessagesSquare, Search, User } from 'lucide-react';

import { cn } from '@/utils/utils';

const navigation = [
  {
    id: '1',
    name: 'Threads',
    icon: MessagesSquare,
    href: '/threads',
  },
  {
    id: '2',
    name: 'Leaderboard',
    icon: ChessQueen,
    href: '/leaderboard',
  },
  {
    id: '3',
    name: 'Search',
    icon: Search,
    href: '/search',
  },
  {
    id: '4',
    name: 'Profile',
    icon: User,
    href: '/profile',
  },
];

export const NavigationBottom = () => {
  const { pathname } = useLocation();

  return (
    <nav className='fixed inset-x-0 bottom-0 max-w-160 z-50 bg-white shadow-sm mx-auto'>
      <ul className='flex items-center justify-between px-8 py-4'>
        {navigation.map((nav) => (
          <li key={nav.id}>
            <a
              href={`${nav.href}`}
              className={cn('flex flex-col items-center gap-2', nav.href === pathname && 'text-primary')}
            >
              <div className='relative'>
                <nav.icon
                  className={nav.href === pathname ? 'stroke-primary fill-primary' : 'stroke-muted-foreground'}
                />
              </div>
              <p className='font-normal text-xs'>{nav.name}</p>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
