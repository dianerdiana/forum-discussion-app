import { ThumbsDown, ThumbsUp } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { useAppDispatch } from '@/redux/hooks';
import type { Comment } from '@/types/comment-type';
import type { User } from '@/types/user-type';
import { cn, postedAt } from '@/utils/utils';

import { handleDownVoteComment, handleNeutralVoteComment, handleUpVoteComment } from '../redux/thread-slice';

type CommentItemProps = {
  comment: Comment;
  ownProfile?: User | null;
  threadId: string;
};

export const CommentItem = ({ comment, ownProfile, threadId }: CommentItemProps) => {
  const dispatch = useAppDispatch();
  const userId = ownProfile?.id;

  const votedUp = !!userId && comment.upVotesBy.includes(userId);
  const votedDown = !!userId && comment.downVotesBy.includes(userId);

  const onVotedUp = () => {
    if (!userId) return;

    if (votedDown) {
      dispatch(handleUpVoteComment({ threadId, commentId: comment.id, userId, showGlobalLoading: false }));
      return;
    }

    dispatch(
      (votedUp ? handleNeutralVoteComment : handleUpVoteComment)({
        threadId,
        commentId: comment.id,
        userId,
        showGlobalLoading: false,
      }),
    );
  };

  const onVotedDown = () => {
    if (!userId) return;

    if (votedUp) {
      dispatch(handleDownVoteComment({ threadId, commentId: comment.id, userId, showGlobalLoading: false }));
      return;
    }

    dispatch(
      (votedDown ? handleNeutralVoteComment : handleDownVoteComment)({
        threadId,
        commentId: comment.id,
        userId,
        showGlobalLoading: false,
      }),
    );
  };

  return (
    <Card key={comment.id}>
      <CardHeader>
        <div className='flex items-center gap-x-1'>
          <Avatar size='sm'>
            <AvatarImage src={comment.owner?.avatar} />
            <AvatarFallback>{comment.owner?.name[0]}</AvatarFallback>
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
            <Button
              aria-label='up-vote'
              onClick={onVotedUp}
              size='sm'
              variant='ghost'
              className='hover:bg-transparent text-foreground hover:text-foreground'
              disabled={!userId}
            >
              <ThumbsUp className={cn('size-5 stroke-foreground', { 'fill-primary': votedUp })} />
              {comment.upVotesBy.length}
            </Button>

            <Button
              onClick={onVotedDown}
              size='sm'
              variant='ghost'
              className='hover:bg-transparent text-foreground hover:text-foreground'
              disabled={!userId}
            >
              <ThumbsDown className={cn('size-5 stroke-foreground', { 'fill-primary': votedDown })} />
              {comment.downVotesBy.length}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
