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
    content: 'Ini komentar',
    createdAt: '2026-02-26T00:00:00.000Z',
    owner: { id: 'u-owner', name: 'Sari', avatar: 'https://example.com/a.png' },
    upVotesBy: [],
    downVotesBy: [],
    ...overrides,
  };
}

describe('CommentItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render informasi dasar komentar', () => {
    const comment = makeComment();

    render(<CommentItem comment={comment as any} ownProfile={{ id: 'u-1' } as any} threadId='thread-1' />);

    expect(screen.getByText('Sari')).toBeInTheDocument();
    expect(screen.getByText('Ini komentar')).toBeInTheDocument();

    // postedAt dimock
    expect(screen.getByText('2h ago')).toBeInTheDocument();

    // avatar image + fallback ada (fallback isinya name, tapi tetap render)
    expect(screen.getByAltText('avatar')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('S');
  });

  it('vote button disabled jika tidak ada ownProfile dan tidak dispatch', async () => {
    const user = userEvent.setup();
    const comment = makeComment();

    render(<CommentItem comment={comment as any} ownProfile={null} threadId='thread-1' />);

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

  it('klik upvote: jika belum vote -> dispatch handleUpVoteComment', async () => {
    const user = userEvent.setup();
    const comment = makeComment({ upVotesBy: [], downVotesBy: [] });

    render(<CommentItem comment={comment as any} ownProfile={{ id: 'u-1' } as any} threadId='thread-1' />);

    await user.click(screen.getByRole('button', { name: 'up-vote' }));

    expect(handleUpVoteCommentMock).toHaveBeenCalledWith({
      threadId: 'thread-1',
      commentId: 'comment-1',
      userId: 'u-1',
      showGlobalLoading: false,
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'comments/upVote',
      payload: {
        threadId: 'thread-1',
        commentId: 'comment-1',
        userId: 'u-1',
        showGlobalLoading: false,
      },
    });
  });

  it('klik upvote: jika sudah upvote -> dispatch handleNeutralVoteComment', async () => {
    const user = userEvent.setup();
    const comment = makeComment({ upVotesBy: ['u-1'], downVotesBy: [] });

    render(<CommentItem comment={comment as any} ownProfile={{ id: 'u-1' } as any} threadId='thread-1' />);

    await user.click(screen.getByRole('button', { name: 'up-vote' }));

    expect(handleNeutralVoteCommentMock).toHaveBeenCalledWith({
      threadId: 'thread-1',
      commentId: 'comment-1',
      userId: 'u-1',
      showGlobalLoading: false,
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'comments/neutralVote',
      payload: {
        threadId: 'thread-1',
        commentId: 'comment-1',
        userId: 'u-1',
        showGlobalLoading: false,
      },
    });
  });

  it('klik upvote: jika sebelumnya downvote -> dispatch handleUpVoteComment (switch)', async () => {
    const user = userEvent.setup();
    const comment = makeComment({ upVotesBy: [], downVotesBy: ['u-1'] });

    render(<CommentItem comment={comment as any} ownProfile={{ id: 'u-1' } as any} threadId='thread-1' />);

    await user.click(screen.getByRole('button', { name: 'up-vote' }));

    expect(handleUpVoteCommentMock).toHaveBeenCalledWith({
      threadId: 'thread-1',
      commentId: 'comment-1',
      userId: 'u-1',
      showGlobalLoading: false,
    });

    expect(handleNeutralVoteCommentMock).not.toHaveBeenCalled();
  });

  it('klik downvote: jika belum vote -> dispatch handleDownVoteComment', async () => {
    const user = userEvent.setup();
    const comment = makeComment({ upVotesBy: [], downVotesBy: [] });

    render(<CommentItem comment={comment as any} ownProfile={{ id: 'u-1' } as any} threadId='thread-1' />);

    await user.click(screen.getByRole('button', { name: 'down-vote' }));

    expect(handleDownVoteCommentMock).toHaveBeenCalledWith({
      threadId: 'thread-1',
      commentId: 'comment-1',
      userId: 'u-1',
      showGlobalLoading: false,
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'comments/downVote',
      payload: {
        threadId: 'thread-1',
        commentId: 'comment-1',
        userId: 'u-1',
        showGlobalLoading: false,
      },
    });
  });

  it('klik downvote: jika sudah downvote -> dispatch handleNeutralVoteComment', async () => {
    const user = userEvent.setup();
    const comment = makeComment({ upVotesBy: [], downVotesBy: ['u-1'] });

    render(<CommentItem comment={comment as any} ownProfile={{ id: 'u-1' } as any} threadId='thread-1' />);

    await user.click(screen.getByRole('button', { name: 'down-vote' }));

    expect(handleNeutralVoteCommentMock).toHaveBeenCalledWith({
      threadId: 'thread-1',
      commentId: 'comment-1',
      userId: 'u-1',
      showGlobalLoading: false,
    });
  });

  it('klik downvote: jika sebelumnya upvote -> dispatch handleDownVoteComment (switch)', async () => {
    const user = userEvent.setup();
    const comment = makeComment({ upVotesBy: ['u-1'], downVotesBy: [] });

    render(<CommentItem comment={comment as any} ownProfile={{ id: 'u-1' } as any} threadId='thread-1' />);

    await user.click(screen.getByRole('button', { name: 'down-vote' }));

    expect(handleDownVoteCommentMock).toHaveBeenCalledWith({
      threadId: 'thread-1',
      commentId: 'comment-1',
      userId: 'u-1',
      showGlobalLoading: false,
    });

    expect(handleNeutralVoteCommentMock).not.toHaveBeenCalled();
  });
});
