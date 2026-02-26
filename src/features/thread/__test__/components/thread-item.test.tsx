import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThreadItem } from '../../components/thread-item.tsx';

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

// ========== Mock action creators (RTK slice thunks/actions) ==========
const handleUpVoteThreadMock = vi.fn((payload: any) => ({ type: 'threads/upVote', payload }));
const handleDownVoteThreadMock = vi.fn((payload: any) => ({ type: 'threads/downVote', payload }));
const handleNeutralVoteThreadMock = vi.fn((payload: any) => ({ type: 'threads/neutralVote', payload }));

vi.mock('../../redux/thread-slice', () => ({
  handleUpVoteThread: (payload: any) => handleUpVoteThreadMock(payload),
  handleDownVoteThread: (payload: any) => handleDownVoteThreadMock(payload),
  handleNeutralVoteThread: (payload: any) => handleNeutralVoteThreadMock(payload),
}));

// ========== Mock lucide icons ==========
vi.mock('lucide-react', () => ({
  ThumbsUp: (props: any) => <svg data-testid='icon-thumbs-up' {...props} />,
  ThumbsDown: (props: any) => <svg data-testid='icon-thumbs-down' {...props} />,
  MessageCircle: (props: any) => <svg data-testid='icon-message-circle' {...props} />,
}));

/**
 * Mock UI components (shadcn/radix wrappers) into lightweight primitives,
 * so tests focus on ThreadItem behavior rather than UI library internals.
 */
vi.mock('@/components/ui/button', () => ({
  Button: ({ asChild, children, onClick, disabled, ...rest }: any) => {
    if (asChild) return <>{children}</>;
    return (
      <button onClick={onClick} disabled={disabled} {...rest}>
        {children}
      </button>
    );
  },
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div data-testid='avatar'>{children}</div>,
  AvatarImage: (props: any) => <img alt='avatar' {...props} />,
  AvatarFallback: ({ children }: any) => <span data-testid='avatar-fallback'>{children}</span>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <section>{children}</section>,
  CardHeader: ({ children }: any) => <header>{children}</header>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <footer>{children}</footer>,
  CardAction: ({ children }: any) => <span>{children}</span>,
}));

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function makeThread(overrides: Partial<any> = {}) {
  return {
    id: 'thread-1',
    title: 'Thread title',
    body: 'Thread body',
    category: 'react',
    createdAt: '2026-02-26T00:00:00.000Z',
    owner: { id: 'u-owner', name: 'Budi', avatar: 'https://example.com/a.png' },
    upVotesBy: [],
    downVotesBy: [],
    totalComments: 7,
    ...overrides,
  };
}

const defaultOwnProfile = { id: 'u-1' };

function renderSubject({
  threadOverrides,
  ownProfile = defaultOwnProfile,
  isDetail,
}: {
  threadOverrides?: Partial<any>;
  ownProfile?: any;
  isDetail?: boolean;
} = {}) {
  const thread = makeThread(threadOverrides);
  renderWithRouter(<ThreadItem thread={thread as any} ownProfile={ownProfile as any} isDetail={isDetail} />);
  return { thread, ownProfile, isDetail };
}

describe('ThreadItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render basic thread information and link to the detail page', () => {
      renderSubject();

      expect(screen.getByText('Budi')).toBeInTheDocument();
      expect(screen.getByText('Thread title')).toBeInTheDocument();
      expect(screen.getByText('Thread body')).toBeInTheDocument();
      expect(screen.getByText('#react')).toBeInTheDocument();

      // postedAt is mocked
      expect(screen.getByText('2h ago')).toBeInTheDocument();

      const titleLink = screen.getByRole('link', { name: 'Thread title' });
      expect(titleLink).toHaveAttribute('href', '/threads/thread-1/details');
    });

    it('should render the comments link when isDetail is false', () => {
      renderSubject({ threadOverrides: { totalComments: 3 }, isDetail: false });

      const commentLink = screen.getByRole('link', { name: /3/i });
      expect(commentLink).toHaveAttribute('href', '/threads/thread-1/details');
    });

    it('should not render the comments link when isDetail is true', () => {
      renderSubject({ threadOverrides: { totalComments: 3 }, isDetail: true });

      expect(screen.queryByRole('link', { name: /3/i })).not.toBeInTheDocument();
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
      expect(handleUpVoteThreadMock).not.toHaveBeenCalled();
      expect(handleDownVoteThreadMock).not.toHaveBeenCalled();
      expect(handleNeutralVoteThreadMock).not.toHaveBeenCalled();
    });
  });

  describe('voting - upvote', () => {
    it('should dispatch upvote when user has not voted yet', async () => {
      const user = userEvent.setup();

      renderSubject({
        threadOverrides: { upVotesBy: [], downVotesBy: [] },
      });

      await user.click(screen.getByRole('button', { name: 'up-vote' }));

      expect(handleUpVoteThreadMock).toHaveBeenCalledWith({
        threadId: 'thread-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'threads/upVote',
        payload: {
          threadId: 'thread-1',
          userId: 'u-1',
          showGlobalLoading: false,
        },
      });
    });

    it('should dispatch neutral vote when user has already upvoted', async () => {
      const user = userEvent.setup();

      renderSubject({
        threadOverrides: { upVotesBy: ['u-1'], downVotesBy: [] },
      });

      await user.click(screen.getByRole('button', { name: 'up-vote' }));

      expect(handleNeutralVoteThreadMock).toHaveBeenCalledWith({
        threadId: 'thread-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'threads/neutralVote',
        payload: {
          threadId: 'thread-1',
          userId: 'u-1',
          showGlobalLoading: false,
        },
      });
    });

    it('should dispatch upvote when user previously downvoted (switch vote)', async () => {
      const user = userEvent.setup();

      renderSubject({
        threadOverrides: { upVotesBy: [], downVotesBy: ['u-1'] },
      });

      await user.click(screen.getByRole('button', { name: 'up-vote' }));

      expect(handleUpVoteThreadMock).toHaveBeenCalledWith({
        threadId: 'thread-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(handleNeutralVoteThreadMock).not.toHaveBeenCalled();
    });
  });

  describe('voting - downvote', () => {
    it('should dispatch downvote when user has not voted yet', async () => {
      const user = userEvent.setup();

      renderSubject({
        threadOverrides: { upVotesBy: [], downVotesBy: [] },
      });

      await user.click(screen.getByRole('button', { name: 'down-vote' }));

      expect(handleDownVoteThreadMock).toHaveBeenCalledWith({
        threadId: 'thread-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'threads/downVote',
        payload: {
          threadId: 'thread-1',
          userId: 'u-1',
          showGlobalLoading: false,
        },
      });
    });

    it('should dispatch neutral vote when user has already downvoted', async () => {
      const user = userEvent.setup();

      renderSubject({
        threadOverrides: { upVotesBy: [], downVotesBy: ['u-1'] },
      });

      await user.click(screen.getByRole('button', { name: 'down-vote' }));

      expect(handleNeutralVoteThreadMock).toHaveBeenCalledWith({
        threadId: 'thread-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });
    });

    it('should dispatch downvote when user previously upvoted (switch vote)', async () => {
      const user = userEvent.setup();

      renderSubject({
        threadOverrides: { upVotesBy: ['u-1'], downVotesBy: [] },
      });

      await user.click(screen.getByRole('button', { name: 'down-vote' }));

      expect(handleDownVoteThreadMock).toHaveBeenCalledWith({
        threadId: 'thread-1',
        userId: 'u-1',
        showGlobalLoading: false,
      });

      expect(handleNeutralVoteThreadMock).not.toHaveBeenCalled();
    });
  });
});
