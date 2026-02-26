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

// ========== Mock zod schema (ensure deterministic validation) ==========
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

const defaultThreadId = 'thread-1';

function renderSubject({
  threadId = defaultThreadId,
  totalComments = 0,
}: {
  threadId?: string;
  totalComments?: number;
} = {}) {
  render(<CreateCommentForm threadId={threadId} totalComments={totalComments} />);
  return { threadId, totalComments };
}

function getTextarea() {
  return screen.getByPlaceholderText('Comment...') as HTMLTextAreaElement;
}

describe('CreateCommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the comments header with total count and the submit button', () => {
      renderSubject({ totalComments: 7 });

      expect(screen.getByText('Comments (7)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should show an error and not dispatch or toast when submitting an empty form', async () => {
      const user = userEvent.setup();
      renderSubject({ totalComments: 0 });

      await user.click(screen.getByRole('button', { name: 'Send' }));

      // error rendered by FieldError (role=alert)
      expect(await screen.findByRole('alert')).toHaveTextContent('Content is required');

      expect(dispatchMock).not.toHaveBeenCalled();
      expect(createCommentMock).not.toHaveBeenCalled();
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(toastErrorMock).not.toHaveBeenCalled();
    });
  });

  describe('submission', () => {
    it('should dispatch createComment, show success toast, and reset the textarea on success', async () => {
      const user = userEvent.setup();

      // dispatch resolves with a "success" payload
      dispatchMock.mockResolvedValueOnce({
        payload: { status: 'success', message: 'Comment created' },
      });

      renderSubject({ threadId: defaultThreadId, totalComments: 3 });

      await user.type(getTextarea(), 'Hello, this is a comment');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() => {
        expect(createCommentMock).toHaveBeenCalledWith({
          content: 'Hello, this is a comment',
          threadId: defaultThreadId,
        });
      });

      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'threads/createComment',
        payload: { content: 'Hello, this is a comment', threadId: defaultThreadId },
      });

      expect(toastSuccessMock).toHaveBeenCalledWith('Comment created');
      expect(toastErrorMock).not.toHaveBeenCalled();

      // RHF reset: textarea becomes empty
      await waitFor(() => {
        expect(getTextarea().value).toBe('');
      });
    });

    it('should show error toast and keep textarea value on failure', async () => {
      const user = userEvent.setup();

      dispatchMock.mockResolvedValueOnce({
        payload: { status: 'error', message: 'Failed to create comment' },
      });

      renderSubject({ threadId: defaultThreadId, totalComments: 3 });

      await user.type(getTextarea(), 'This will fail');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() => {
        expect(createCommentMock).toHaveBeenCalledWith({
          content: 'This will fail',
          threadId: defaultThreadId,
        });
      });

      expect(toastErrorMock).toHaveBeenCalledWith('Failed to create comment');
      expect(toastSuccessMock).not.toHaveBeenCalled();

      // failure: should not reset, value remains
      expect(getTextarea().value).toBe('This will fail');
    });
  });
});
