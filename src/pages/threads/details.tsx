import { useEffect } from 'react';
import { useParams } from 'react-router';

import { Container } from '@/components/container';
import { CommentItem } from '@/features/thread/components/comment-item';
import { CreateCommentForm } from '@/features/thread/components/create-comment-form';
import { ThreadItem } from '@/features/thread/components/thread-item';
import { getThread, selectSelectedThread } from '@/features/thread/redux/thread-slice';
import { selectOwnProfile } from '@/features/user/redux/user-slice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';

const DetailThreadPage = () => {
  const params = useParams();
  const threadId = params.id as string;

  const dispatch = useAppDispatch();
  const selectedThread = useAppSelector(selectSelectedThread);
  const ownProfile = useAppSelector(selectOwnProfile);

  useEffect(() => {
    dispatch(getThread({ threadId }));
  }, [dispatch, threadId]);

  return (
    <Container className='pb-24 space-y-8'>
      <div className='bg-foreground flex items-center py-4 px-4'>
        <h1 className='text-2xl font-bold text-white'>Details Thread</h1>
      </div>
      {selectedThread ? (
        <div className='px-4 space-y-4'>
          <ThreadItem thread={selectedThread} ownProfile={ownProfile} isDetail />
          <CreateCommentForm threadId={selectedThread.id} totalComments={selectedThread.comments?.length || 0} />
          {selectedThread.comments &&
            selectedThread.comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} ownProfile={ownProfile} threadId={threadId} />
            ))}
        </div>
      ) : null}
    </Container>
  );
};

export default DetailThreadPage;
