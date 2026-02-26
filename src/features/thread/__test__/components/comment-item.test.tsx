import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CommentItem } from '../../components/comment-item';

// ========== Mock redux hooks ==========
const dispatchMock = vi.fn();

vi.mock('@/redux/hooks', () => ({
  useAppDispatch: () => dispatchMock,
}));

// ========== Mock utils ==========
vi.mock('@/utils/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  postedAt: () => '2h ago',
}));

// ========== Mock action creators ==========
const handleUpVoteCommentMock = vi.fn((payload: any) => ({ type: 'comments/upVote', payload }));
const handleDownVoteCommentMock = vi.fn((payload: any) => ({ type: 'comments/downVote', payload }));
const handleNeutralVoteCommentMock = vi.fn((payload: any) => ({ type: 'comments/neutralVote', payload }));

vi.mock('../../redux/thread-slice', () => ({
  handleUpVoteComment: (payload: any) => handleUpVoteCommentMock(payload),
  handleDownVoteComment: (payload: any) => handleDownVoteCommentMock(payload),
  handleNeutralVoteComment: (payload: any) => handleNeutralVoteCommentMock(payload),
}));

// ========== Mock lucide icons ==========
vi.mock('lucide-react', () => ({
  ThumbsUp: (props: any) => <svg data-testid='icon-thumbs-up' {...props} />,
  ThumbsDown: (props: any) => <svg data-testid='icon-thumbs-down' {...props} />,
}));

// ========== Mock UI components (shadcn wrappers) ==========
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div data-testid='avatar'>{children}</div>,
  AvatarImage: (props: any) => <img alt='avatar' {...props} />,
  AvatarFallback: ({ children }: any) => <span data-testid='avatar-fallback'>{children}</span>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <section>{children}</section>,
  CardHeader: ({ children }: any) => <header>{children}</header>,
  CardContent: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  CardFooter: ({ children, ...rest }: any) => <footer {...rest}>{children}</footer>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardAction: ({ children }: any) => <span>{children}</span>,
}));

function makeComment(overrides: Partial<any> = {}) {
  return {
    id: 'comment-1',
    content: 'This is a comment',
    createdAt: '2026-02-26T00:00:00.000Z',
    owner: { id: 'u-owner', name: 'Sari', avatar: 'https://example.com/a.png' },
    upVotesBy: [],
    downVotesBy: [],
    ...overrides,
  };
}

const defaultThreadId = 'thread-1';
const defaultOwnProfile = { id: 'u-1' };

function renderSubject({
  commentOverrides,
  ownProfile = defaultOwnProfile,
  threadId = defaultThreadId,
}: {
  commentOverrides?: Partial<any>;
  ownProfile?: any;
  threadId?: string;
} = {}) {
  const comment = makeComment(commentOverrides);
  render(<CommentItem comment={comment as any} ownProfile={ownProfile as any} threadId={threadId} />);
  return { comment, threadId, ownProfile };
}

describe('CommentItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render basic comment information', () => {
      renderSubject();

      expect(screen.getByText('Sari')).toBeInTheDocument();
      expect(screen.getByText('This is a comment')).toBeInTheDocument();

      // postedAt is mocked
      expect(screen.getByText('2h ago')).toBeInTheDocument();

      // avatar image + fallback are present (fallback contains first letter)
      expect(screen.getByAltText('avatar')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('S');
    });
  });

  describe('voting - unauthenticated', () => {
    it('should disable vote buttons and not dispatch actions when ownProfile is missing', async () => {
      const user = userEvent.setup();
      renderSubject({ ownProfile: null });

      const upBtn = screen.getByRole('button', { name: 'up-vote' });
      const downBtn = screen.getByRole('button', { name: 'down-vote' });

      expect(upBtn).toBeDisabled();
      expect(downBtn).toBeDisabled();

      await user.click(upBtn);
      await user.click(downBtn);

      expect(dispatchMock).not.toHaveBeenCalled();
      expect(handleUpVoteCommentMock).not.toHaveBeenCalled();
      expect(handleDownVoteCommentMock).not.toHaveBeenCalled();
      expect(handleNeutralVoteCommentMock).not.toHaveBeenCalled();
    });
  });

  describe('voting - upvote', () => {
    it('should dispatch upvote when user has not voted yet', async () => {
      const user = userEvent.setup();

      renderSubject({
        commentOverrides: { upVotesBy: [], downVotesBy: [] },
      });

      await user.click(screen.getByRole('button', { name: 'up-vote' }));

      expect(handleUpVoteCommentMock).toHaveBeenCalledWith({
        threadId: defaultThreadId,
        commentId: 'comment-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'comments/upVote',
        payload: {
          threadId: defaultThreadId,
          commentId: 'comment-1',
          userId: 'u-1',
          showGlobalLoading: false,
        },
      });
    });

    it('should dispatch neutral vote when user has already upvoted', async () => {
      const user = userEvent.setup();

      renderSubject({
        commentOverrides: { upVotesBy: ['u-1'], downVotesBy: [] },
      });

      await user.click(screen.getByRole('button', { name: 'up-vote' }));

      expect(handleNeutralVoteCommentMock).toHaveBeenCalledWith({
        threadId: defaultThreadId,
        commentId: 'comment-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'comments/neutralVote',
        payload: {
          threadId: defaultThreadId,
          commentId: 'comment-1',
          userId: 'u-1',
          showGlobalLoading: false,
        },
      });
    });

    it('should dispatch upvote when user previously downvoted (switch vote)', async () => {
      const user = userEvent.setup();

      renderSubject({
        commentOverrides: { upVotesBy: [], downVotesBy: ['u-1'] },
      });

      await user.click(screen.getByRole('button', { name: 'up-vote' }));

      expect(handleUpVoteCommentMock).toHaveBeenCalledWith({
        threadId: defaultThreadId,
        commentId: 'comment-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(handleNeutralVoteCommentMock).not.toHaveBeenCalled();
    });
  });

  describe('voting - downvote', () => {
    it('should dispatch downvote when user has not voted yet', async () => {
      const user = userEvent.setup();

      renderSubject({
        commentOverrides: { upVotesBy: [], downVotesBy: [] },
      });

      await user.click(screen.getByRole('button', { name: 'down-vote' }));

      expect(handleDownVoteCommentMock).toHaveBeenCalledWith({
        threadId: defaultThreadId,
        commentId: 'comment-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'comments/downVote',
        payload: {
          threadId: defaultThreadId,
          commentId: 'comment-1',
          userId: 'u-1',
          showGlobalLoading: false,
        },
      });
    });

    it('should dispatch neutral vote when user has already downvoted', async () => {
      const user = userEvent.setup();

      renderSubject({
        commentOverrides: { upVotesBy: [], downVotesBy: ['u-1'] },
      });

      await user.click(screen.getByRole('button', { name: 'down-vote' }));

      expect(handleNeutralVoteCommentMock).toHaveBeenCalledWith({
        threadId: defaultThreadId,
        commentId: 'comment-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });
    });

    it('should dispatch downvote when user previously upvoted (switch vote)', async () => {
      const user = userEvent.setup();

      renderSubject({
        commentOverrides: { upVotesBy: ['u-1'], downVotesBy: [] },
      });

      await user.click(screen.getByRole('button', { name: 'down-vote' }));

      expect(handleDownVoteCommentMock).toHaveBeenCalledWith({
        threadId: defaultThreadId,
        commentId: 'comment-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(handleNeutralVoteCommentMock).not.toHaveBeenCalled();
    });
  });
});
