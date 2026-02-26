import { Link } from 'react-router-dom';

import { MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useAppDispatch } from '@/redux/hooks';
import type { Thread } from '@/types/thread-type';
import type { User } from '@/types/user-type';
import { cn, postedAt } from '@/utils/utils';

import { handleDownVoteThread, handleNeutralVoteThread, handleUpVoteThread } from '../redux/thread-slice';

type ThreadItemProps = {
  thread: Thread;
  isDetail?: boolean;
  ownProfile?: User | null;
};

export const ThreadItem = ({ thread, isDetail = false, ownProfile }: ThreadItemProps) => {
  const dispatch = useAppDispatch();
  const userId = ownProfile?.id;

  const votedUp = !!userId && thread.upVotesBy.includes(userId);
  const votedDown = !!userId && thread.downVotesBy.includes(userId);

  const onVotedUp = () => {
    if (!userId) return;

    if (votedDown) {
      dispatch(handleUpVoteThread({ threadId: thread.id, userId, showGlobalLoading: false }));
      return;
    }

    dispatch(
      (votedUp ? handleNeutralVoteThread : handleUpVoteThread)({
        threadId: thread.id,
        userId,
        showGlobalLoading: false,
      }),
    );
  };

  const onVotedDown = () => {
    if (!userId) return;

    if (votedUp) {
      dispatch(handleDownVoteThread({ threadId: thread.id, userId, showGlobalLoading: false }));
      return;
    }

    dispatch(
      (votedDown ? handleNeutralVoteThread : handleDownVoteThread)({
        threadId: thread.id,
        userId,
        showGlobalLoading: false,
      }),
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-x-1'>
          <Avatar>
            <AvatarImage src={thread.owner?.avatar} />
            <AvatarFallback>{thread.owner?.name?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <p className='text-sm'>{thread.owner?.name}</p>
        </div>

        <CardTitle>
          <Link to={`/threads/${thread.id}/details`}>{thread.title}</Link>
        </CardTitle>

        <CardAction>{postedAt(thread.createdAt)}</CardAction>
      </CardHeader>

      <CardContent className='space-y-2'>
        <CardDescription>{thread.body}</CardDescription>
        <Badge variant='outline'>#{thread.category}</Badge>
      </CardContent>

      <CardFooter className='bg-foreground'>
        <div className='flex w-full items-center justify-between'>
          <div className='flex'>
            <Button
              aria-label='up-vote'
              onClick={onVotedUp}
              size='sm'
              variant='ghost'
              className='hover:bg-transparent text-white hover:text-white'
              disabled={!userId}
            >
              <ThumbsUp className={cn('size-5 stroke-white', { 'fill-primary': votedUp })} />
              {thread.upVotesBy.length}
            </Button>

            <Button
              aria-label='down-vote'
              onClick={onVotedDown}
              size='sm'
              variant='ghost'
              className='hover:bg-transparent text-white hover:text-white'
              disabled={!userId}
            >
              <ThumbsDown className={cn('size-5 stroke-white', { 'fill-primary': votedDown })} />
              {thread.downVotesBy.length}
            </Button>
          </div>

          {!isDetail && (
            <Button asChild size='sm' variant='ghost' className='hover:bg-transparent text-white hover:text-white'>
              <Link to={`/threads/${thread.id}/details`}>
                <MessageCircle className='size-5 stroke-white' />
                {thread.totalComments ?? 0}
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
