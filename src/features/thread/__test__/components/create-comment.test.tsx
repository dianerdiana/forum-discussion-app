import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

import { CreateCommentForm } from '../../components/create-comment-form';

// ========== Mock redux hooks ==========
const dispatchMock = vi.fn();

vi.mock('@/redux/hooks', () => ({
  useAppDispatch: () => dispatchMock,
}));

// ========== Mock toast ==========
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccessMock(msg),
    error: (msg: string) => toastErrorMock(msg),
  },
}));

// ========== Mock schema zod (supaya pasti ada validasi minimal) ==========
vi.mock('../../schema/create-comment-schema', () => ({
  createCommentSchema: z.object({
    content: z.string().min(1, 'Content is required'),
  }),
}));

// ========== Mock action creator ==========
const createCommentMock = vi.fn((payload: any) => ({ type: 'threads/createComment', payload }));

vi.mock('../../redux/thread-slice', () => ({
  createComment: (payload: any) => createCommentMock(payload),
}));

// ========== Mock UI components (shadcn wrappers) ==========
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...rest }: any) => <section {...rest}>{children}</section>,
  CardHeader: ({ children }: any) => <header>{children}</header>,
  CardTitle: ({ children, ...rest }: any) => <h2 {...rest}>{children}</h2>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <footer>{children}</footer>,
}));

vi.mock('@/components/ui/field', () => ({
  FieldGroup: ({ children }: any) => <div data-testid='field-group'>{children}</div>,
  Field: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  FieldError: ({ errors }: any) => <div role='alert'>{errors?.[0]?.message ?? 'Invalid'}</div>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

describe('CreateCommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render header Comments (total)', () => {
    render(<CreateCommentForm threadId='thread-1' totalComments={7} />);
    expect(screen.getByText('Comments (7)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('validasi: submit kosong -> tampil error, tidak dispatch, tidak toast', async () => {
    const user = userEvent.setup();
    render(<CreateCommentForm threadId='thread-1' totalComments={0} />);

    await user.click(screen.getByRole('button', { name: 'Send' }));

    // error dari FieldError (role=alert)
    expect(await screen.findByRole('alert')).toHaveTextContent('Content is required');

    expect(dispatchMock).not.toHaveBeenCalled();
    expect(createCommentMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('submit sukses -> dispatch(createComment), toast.success, reset textarea', async () => {
    const user = userEvent.setup();

    // dispatch mengembalikan payload sukses
    dispatchMock.mockResolvedValueOnce({
      payload: { status: 'success', message: 'Comment created' },
    });

    render(<CreateCommentForm threadId='thread-1' totalComments={3} />);

    const textarea = screen.getByPlaceholderText('Comment...') as HTMLTextAreaElement;
    await user.type(textarea, 'Halo, ini komentar');

    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(createCommentMock).toHaveBeenCalledWith({
        content: 'Halo, ini komentar',
        threadId: 'thread-1',
      });
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'threads/createComment',
      payload: { content: 'Halo, ini komentar', threadId: 'thread-1' },
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('Comment created');
    expect(toastErrorMock).not.toHaveBeenCalled();

    // reset() dari RHF: textarea kosong lagi
    await waitFor(() => {
      expect((screen.getByPlaceholderText('Comment...') as HTMLTextAreaElement).value).toBe('');
    });
  });

  it('submit gagal -> toast.error dan tidak reset textarea', async () => {
    const user = userEvent.setup();

    dispatchMock.mockResolvedValueOnce({
      payload: { status: 'error', message: 'Failed to create comment' },
    });

    render(<CreateCommentForm threadId='thread-1' totalComments={3} />);

    const textarea = screen.getByPlaceholderText('Comment...') as HTMLTextAreaElement;
    await user.type(textarea, 'Komentar gagal');

    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(createCommentMock).toHaveBeenCalledWith({
        content: 'Komentar gagal',
        threadId: 'thread-1',
      });
    });

    expect(toastErrorMock).toHaveBeenCalledWith('Failed to create comment');
    expect(toastSuccessMock).not.toHaveBeenCalled();

    // gagal: tidak reset, value masih ada
    expect((screen.getByPlaceholderText('Comment...') as HTMLTextAreaElement).value).toBe('Komentar gagal');
  });
});
