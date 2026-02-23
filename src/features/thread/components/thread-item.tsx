import { Link } from 'react-router';

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

export const ThreadItem = ({ thread }: { thread: Thread }) => {
  return (
    <Card key={thread.id}>
      <CardHeader>
        <CardTitle>
          <Link to={`/threads/${thread.id}/details`}>{thread.title}</Link>
        </CardTitle>
        <CardAction>{thread.category}</CardAction>
      </CardHeader>
      <CardContent>
        <CardDescription>{thread.body}</CardDescription>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};
