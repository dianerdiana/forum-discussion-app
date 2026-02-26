import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { HeartHandshake } from 'lucide-react';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';
import { ThreadItem } from '@/features/thread/components/thread-item';
import { getThreads, selectThreadsListStatus, threadSelectors } from '@/features/thread/redux/thread-slice';
import { getUsers, selectOwnProfile, userSelectors } from '@/features/user/redux/user-slice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import type { User } from '@/types/user-type';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

const HomePage = () => {
  const dispatch = useAppDispatch();
  const allThreads = useAppSelector(threadSelectors.selectAll);
  const allUsers = useAppSelector(userSelectors.selectAll);
  const threadListStatus = useAppSelector(selectThreadsListStatus);
  const ownProfile = useAppSelector(selectOwnProfile);

  const location = useLocation();
  const hashValue = location.hash.replace('#', '');
  const threadItems = hashValue ? allThreads.filter((thread) => thread.category === hashValue) : allThreads;

  const mapAllUser = new Map<string | undefined, User>(allUsers.map((user) => [user.id, user]));
  const uniqueCategories = new Set<string>(allThreads.map((thread) => thread.category));

  useEffect(() => {
    dispatch(getThreads());
    dispatch(getUsers());
  }, [dispatch]);

  if (threadListStatus === FETCH_STATUS.idle || threadListStatus === FETCH_STATUS.loading) {
    return null;
  }

  return (
    <Container className='flex flex-col min-h-screen gap-y-4 pb-24'>
      <div className='flex items-center w-full justify-between py-4 px-4 bg-foreground'>
        <div className='flex items-center space-x-2'>
          <div className='rounded-md bg-primary/5 p-1'>
            <HeartHandshake className='stroke-primary' />
          </div>
          <h1 className='text-2xl font-bold text-white'>Community</h1>
        </div>
        <div>
          <Button asChild>
            <Link to='/threads/create'>Post</Link>
          </Button>
        </div>
      </div>

      <div className='space-y-2 px-4'>
        <p>Popular Categories:</p>

        <div className='flex flex-wrap gap-1'>
          {[...uniqueCategories].map((category) => (
            <Button variant={hashValue === category ? 'default' : 'outline'} key={category} asChild>
              <Link to={`/#${category}`}>#{category}</Link>
            </Button>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-4 px-4'>
        {threadItems.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={{ ...thread, owner: mapAllUser.get(thread?.ownerId) }}
            ownProfile={ownProfile}
          />
        ))}
      </div>
    </Container>
  );
};

export default HomePage;
