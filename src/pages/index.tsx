import { useEffect } from 'react';

import { HeartHandshake } from 'lucide-react';

import { Container } from '@/components/container';
import { NavigationBottom } from '@/components/navigation-bottom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThreadItem } from '@/features/thread/components/thread-item';
import { getThreads, selectThreadsListStatus, threadSelectors } from '@/features/thread/redux/thread-slice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

const HomePage = () => {
  const dispatch = useAppDispatch();
  const allThreads = useAppSelector(threadSelectors.selectAll);
  const listStatus = useAppSelector(selectThreadsListStatus);

  useEffect(() => {
    dispatch(getThreads());
  }, [dispatch]);

  if (listStatus === FETCH_STATUS.idle || listStatus === FETCH_STATUS.loading) {
    return null;
  }

  return (
    <Container className='flex flex-col min-h-screen px-8 gap-y-4 pb-24'>
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

        <div className='flex flex-wrap gap-1'>
          {allThreads.map((thread) => (
            <Badge variant='outline'>#{thread.category}</Badge>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        {allThreads.map((thread) => (
          <ThreadItem thread={thread} key={thread.id} />
        ))}
      </div>

      <footer>
        <NavigationBottom />
      </footer>
    </Container>
  );
};

export default HomePage;
