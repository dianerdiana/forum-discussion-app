import { Link } from 'react-router';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

type ThreadItemProps = {
  thread: Thread;
  user?: User;
};

export const ThreadItem = ({ thread, user }: ThreadItemProps) => {
  return (
    <Card key={thread.id}>
      <CardHeader>
        <div className='flex items-center gap-x-1'>
          <Avatar size='sm'>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name}</AvatarFallback>
          </Avatar>
          <p className='text-sm'>By: {user?.name}</p>
        </div>
        <CardTitle>
          <Link to={`/threads/${thread.id}/details`}>{thread.title}</Link>
        </CardTitle>
        <CardAction>{thread.category}</CardAction>
      </CardHeader>
      <CardContent className='space-y-2'>
        <CardDescription>{thread.body}</CardDescription>
        <Badge variant='outline'>#{thread.category}</Badge>
      </CardContent>
      <CardFooter className='bg-foreground'>
        <div className='flex items-center gap-x-1'>
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name}</AvatarFallback>
          </Avatar>
          <p className='text-white text-sm font-bold'>{user?.name}</p>
        </div>
      </CardFooter>
    </Card>
  );
};
