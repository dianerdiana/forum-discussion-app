import { ThumbsDown, ThumbsUp } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import type { Comment } from '@/types/comment-type';
import { postedAt } from '@/utils/utils';

type CommentItemProps = {
  comment: Comment;
};

export const CommentItem = ({ comment }: CommentItemProps) => {
  return (
    <Card key={comment.id}>
      <CardHeader>
        <div className='flex items-center gap-x-1'>
          <Avatar size='sm'>
            <AvatarImage src={comment.owner?.avatar} />
            <AvatarFallback>{comment.owner?.name}</AvatarFallback>
          </Avatar>
          <p className='text-sm'>{comment.owner?.name}</p>
        </div>
        <CardAction>{postedAt(comment.createdAt)}</CardAction>
      </CardHeader>
      <CardContent className='space-y-2'>
        <CardDescription>{comment.content}</CardDescription>
      </CardContent>
      <CardFooter className='py-2'>
        <div className='flex justify-between items-center w-full'>
          <div className='flex'>
            <Button size='sm' variant='ghost' className='hover:bg-transparent text-foreground hover:text-foreground'>
              <ThumbsUp className='size-5 stroke-foreground' />
              {comment.upVotesBy.length}
            </Button>
            <Button size='sm' variant='ghost' className='hover:bg-transparent text-foreground hover:text-foreground'>
              <ThumbsDown className='size-5 stroke-foreground' />
              {comment.downVotesBy.length}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
