import { Link, useLocation } from 'react-router';

import { HeartHandshake, House, Search, ShoppingCart, SquareMenu, User } from 'lucide-react';

import { Container } from '@/components/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/utils/utils';

const navigation = [
  {
    id: '1',
    name: 'Home',
    icon: House,
    href: '/',
  },
  {
    id: '2',
    name: 'Menu',
    icon: SquareMenu,
    href: 'products',
  },
  {
    id: '2',
    name: 'Cart',
    icon: ShoppingCart,
    href: 'cart',
    count: 6,
  },
  {
    id: '3',
    name: 'Search',
    icon: Search,
    href: 'search',
  },
  {
    id: '4',
    name: 'Profile',
    icon: User,
    href: 'profile',
  },
];

const HomePage = () => {
  const { pathname } = useLocation();

  return (
    <Container className='flex flex-col min-h-screen px-8 gap-y-4'>
      <div className='flex items-center w-full justify-between py-4'>
        <div className='flex items-center space-x-2'>
          <div className='rounded-md bg-primary/5 p-1'>
            <HeartHandshake className='stroke-primary' />
          </div>
          <h1 className='text-2xl font-bold'>Community</h1>
        </div>
        <div>
          <Button>Post</Button>
        </div>
      </div>

      <div className='space-y-2'>
        <p>Kategori Popular:</p>

        <div className='flex flex-wrap'>
          <Badge variant='outline'>#Perkenalan</Badge>
        </div>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>
              <Link to='/threads/123/details'>Thread Pertama</Link>
            </CardTitle>
            <CardAction>Kategori</CardAction>
          </CardHeader>
          <CardContent>
            <CardDescription>Ini adalah thread pertama</CardDescription>
          </CardContent>
          <CardFooter></CardFooter>
        </Card>
      </div>

      <footer>
        <nav className='fixed inset-x-0 bottom-0 max-w-160 z-50 bg-white shadow-sm mx-auto'>
          <ul className='flex items-center justify-between px-8 py-4'>
            {navigation.map((nav) => (
              <li>
                <a
                  href={`/${nav.href}`}
                  className={cn('flex flex-col items-center gap-2', nav.href === pathname && 'text-primary')}
                >
                  <div className='relative'>
                    <nav.icon
                      className={nav.href === pathname ? 'stroke-primary fill-primary' : 'stroke-muted-foreground'}
                    />
                    {nav.count ? (
                      <div className='absolute -top-1 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-primary border border-white'>
                        <p className='text-white font-normal text-[10px]' id='cart-count'>
                          {nav.count}
                        </p>
                      </div>
                    ) : (
                      ''
                    )}
                  </div>
                  <p className='font-normal text-xs'>{nav.name}</p>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </footer>
    </Container>
  );
};

export default HomePage;
