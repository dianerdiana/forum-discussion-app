import { useEffect } from 'react';
import { Link } from 'react-router';

import { HeartHandshake } from 'lucide-react';

import { Container } from '@/components/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThreadItem } from '@/features/thread/components/thread-item';
import { getThreads, selectThreadsListStatus, threadSelectors } from '@/features/thread/redux/thread-slice';
import { getUsers, userSelectors } from '@/features/user/redux/user-slice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import type { User } from '@/types/user-type';
import { FETCH_STATUS } from '@/utils/constants/fetch-status';

const HomePage = () => {
  const dispatch = useAppDispatch();
  const allThreads = useAppSelector(threadSelectors.selectAll);
  const allUsers = useAppSelector(userSelectors.selectAll);
  const threadListStatus = useAppSelector(selectThreadsListStatus);

  const mapAllUser = new Map<string | undefined, User>(allUsers.map((user) => [user.id, user]));

  useEffect(() => {
    dispatch(getThreads());
    dispatch(getUsers());
  }, [dispatch]);

  if (threadListStatus === FETCH_STATUS.idle || threadListStatus === FETCH_STATUS.loading) {
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
          <Button asChild>
            <Link to='/threads/create'>Post</Link>
          </Button>
        </div>
      </div>

      <div className='space-y-2'>
        <p>Popular Categories:</p>

        <div className='flex flex-wrap gap-1'>
          {allThreads.map((thread) => (
            <Badge variant='outline' key={thread.id}>
              #{thread.category}
            </Badge>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        {allThreads.map((thread) => (
          <ThreadItem key={thread.id} thread={{ ...thread, owner: mapAllUser.get(thread?.ownerId) }} />
        ))}
      </div>
    </Container>
  );
};

export default HomePage;
