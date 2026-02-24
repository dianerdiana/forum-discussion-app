import { Link } from 'react-router';

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
import type { Thread } from '@/types/thread-type';
import type { User } from '@/types/user-type';
import { cn, postedAt } from '@/utils/utils';

type ThreadItemProps = {
  thread: Thread;
  isDetail?: boolean;
  ownProfile?: User | null;
};

export const ThreadItem = ({ thread, isDetail = false, ownProfile }: ThreadItemProps) => {
  return (
    <Card key={thread.id}>
      <CardHeader>
        <div className='flex items-center gap-x-1'>
          <Avatar size='sm'>
            <AvatarImage src={thread.owner?.avatar} />
            <AvatarFallback>{thread.owner?.name}</AvatarFallback>
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
        <div className='flex justify-between items-center w-full'>
          <div className='flex'>
            <Button size='sm' variant='ghost' className='hover:bg-transparent text-white hover:text-white'>
              <ThumbsUp
                className={cn('size-5 stroke-white', {
                  'fill-primary': thread.upVotesBy.includes(ownProfile?.id || ''),
                })}
              />
              {thread.upVotesBy.length}
            </Button>
            <Button size='sm' variant='ghost' className='hover:bg-transparent text-white hover:text-white'>
              <ThumbsDown
                className={cn('size-5 stroke-white', {
                  'fill-primary': thread.downVotesBy.includes(ownProfile?.id || ''),
                })}
              />
              {thread.downVotesBy.length}
            </Button>
          </div>

          {!isDetail && (
            <Button asChild size='sm' variant='ghost' className='hover:bg-transparent text-white hover:text-white'>
              <Link to={`/threads/${thread.id}/details`}>
                <MessageCircle className='size-5 stroke-white' />
                {thread?.totalComments || 0}
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
