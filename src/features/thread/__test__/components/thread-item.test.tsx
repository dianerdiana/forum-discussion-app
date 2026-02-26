import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThreadItem } from '../../components/thread-item.tsx';

// ✅ Mock hooks redux
const dispatchMock = vi.fn();

vi.mock('@/redux/hooks', () => ({
  useAppDispatch: () => dispatchMock,
}));

// ✅ Mock utils
vi.mock('@/utils/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  postedAt: () => '2 hours ago',
}));

// ✅ Mock action creators (RTK slice thunks/actions)
const handleUpVoteThreadMock = vi.fn((payload: any) => ({ type: 'threads/upVote', payload }));
const handleDownVoteThreadMock = vi.fn((payload: any) => ({ type: 'threads/downVote', payload }));
const handleNeutralVoteThreadMock = vi.fn((payload: any) => ({ type: 'threads/neutralVote', payload }));

vi.mock('../../redux/thread-slice', () => ({
  handleUpVoteThread: (payload: any) => handleUpVoteThreadMock(payload),
  handleDownVoteThread: (payload: any) => handleDownVoteThreadMock(payload),
  handleNeutralVoteThread: (payload: any) => handleNeutralVoteThreadMock(payload),
}));

// ✅ Mock lucide icons (supaya tidak ribet SVG)
vi.mock('lucide-react', () => ({
  ThumbsUp: (props: any) => <svg data-testid='icon-thumbs-up' {...props} />,
  ThumbsDown: (props: any) => <svg data-testid='icon-thumbs-down' {...props} />,
  MessageCircle: (props: any) => <svg data-testid='icon-message-circle' {...props} />,
}));

/**
 * ✅ Mock komponen UI (shadcn / radix) jadi wrapper sederhana.
 * Tujuannya supaya test fokus pada behavior ThreadItem, bukan implementasi UI library.
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
    title: 'Judul Thread',
    body: 'Ini isi thread',
    category: 'react',
    createdAt: '2026-02-26T00:00:00.000Z',
    owner: { id: 'u-owner', name: 'Budi', avatar: 'https://example.com/a.png' },
    upVotesBy: [],
    downVotesBy: [],
    totalComments: 7,
    ...overrides,
  };
}

describe('ThreadItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render informasi dasar thread', () => {
    const thread = makeThread();
    renderWithRouter(<ThreadItem thread={thread as any} ownProfile={{ id: 'u-1' } as any} />);

    expect(screen.getByText('Budi')).toBeInTheDocument();
    expect(screen.getByText('Judul Thread')).toBeInTheDocument();
    expect(screen.getByText('Ini isi thread')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();

    // postedAt dimock jadi "2 hours ago"
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();

    // Link title menuju detail
    const titleLink = screen.getByRole('link', { name: 'Judul Thread' });
    expect(titleLink).toHaveAttribute('href', '/threads/thread-1/details');
  });

  it('tombol komentar muncul jika isDetail=false', () => {
    const thread = makeThread({ totalComments: 3 });
    renderWithRouter(<ThreadItem thread={thread as any} isDetail={false} ownProfile={{ id: 'u-1' } as any} />);

    const commentLink = screen.getByRole('link', { name: /3/i });
    expect(commentLink).toHaveAttribute('href', '/threads/thread-1/details');
  });

  it('tombol komentar tidak muncul jika isDetail=true', () => {
    const thread = makeThread({ totalComments: 3 });
    renderWithRouter(<ThreadItem thread={thread as any} isDetail ownProfile={{ id: 'u-1' } as any} />);

    expect(screen.queryByRole('link', { name: /3/i })).not.toBeInTheDocument();
  });

  it('vote button disabled jika tidak ada ownProfile (belum login) dan tidak dispatch', async () => {
    const user = userEvent.setup();
    const thread = makeThread();

    renderWithRouter(<ThreadItem thread={thread as any} ownProfile={null} />);

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

  it('klik upvote: jika belum vote -> dispatch handleUpVoteThread', async () => {
    const user = userEvent.setup();
    const thread = makeThread({ upVotesBy: [], downVotesBy: [] });

    renderWithRouter(<ThreadItem thread={thread as any} ownProfile={{ id: 'u-1' } as any} />);

    const upBtn = screen.getByRole('button', { name: 'up-vote' });
    await user.click(upBtn);

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

  it('klik upvote: jika sudah upvote -> dispatch handleNeutralVoteThread', async () => {
    const user = userEvent.setup();
    const thread = makeThread({ upVotesBy: ['u-1'], downVotesBy: [] });

    renderWithRouter(<ThreadItem thread={thread as any} ownProfile={{ id: 'u-1' } as any} />);

    const upBtn = screen.getByRole('button', { name: 'up-vote' });
    await user.click(upBtn);

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

  it('klik upvote: jika sebelumnya downvote -> dispatch handleUpVoteThread (switch)', async () => {
    const user = userEvent.setup();
    const thread = makeThread({ upVotesBy: [], downVotesBy: ['u-1'] });

    renderWithRouter(<ThreadItem thread={thread as any} ownProfile={{ id: 'u-1' } as any} />);

    const upBtn = screen.getByRole('button', { name: 'up-vote' });
    await user.click(upBtn);

    expect(handleUpVoteThreadMock).toHaveBeenCalledWith({
      threadId: 'thread-1',
      userId: 'u-1',
      showGlobalLoading: false,
    });
    expect(handleNeutralVoteThreadMock).not.toHaveBeenCalled();
  });

  it('klik downvote: jika belum vote -> dispatch handleDownVoteThread', async () => {
    const user = userEvent.setup();
    const thread = makeThread({ upVotesBy: [], downVotesBy: [] });

    renderWithRouter(<ThreadItem thread={thread as any} ownProfile={{ id: 'u-1' } as any} />);

    const downBtn = screen.getByRole('button', { name: 'down-vote' });
    await user.click(downBtn);

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

  it('klik downvote: jika sudah downvote -> dispatch handleNeutralVoteThread', async () => {
    const user = userEvent.setup();
    const thread = makeThread({ upVotesBy: [], downVotesBy: ['u-1'] });

    renderWithRouter(<ThreadItem thread={thread as any} ownProfile={{ id: 'u-1' } as any} />);

    const downBtn = screen.getByRole('button', { name: 'down-vote' });
    await user.click(downBtn);

    expect(handleNeutralVoteThreadMock).toHaveBeenCalledWith({
      threadId: 'thread-1',
      userId: 'u-1',
      showGlobalLoading: false,
    });
  });

  it('klik downvote: jika sebelumnya upvote -> dispatch handleDownVoteThread (switch)', async () => {
    const user = userEvent.setup();
    const thread = makeThread({ upVotesBy: ['u-1'], downVotesBy: [] });

    renderWithRouter(<ThreadItem thread={thread as any} ownProfile={{ id: 'u-1' } as any} />);

    const downBtn = screen.getByRole('button', { name: 'down-vote' });
    await user.click(downBtn);

    expect(handleDownVoteThreadMock).toHaveBeenCalledWith({
      threadId: 'thread-1',
      userId: 'u-1',
      showGlobalLoading: false,
    });
    expect(handleNeutralVoteThreadMock).not.toHaveBeenCalled();
  });
});
