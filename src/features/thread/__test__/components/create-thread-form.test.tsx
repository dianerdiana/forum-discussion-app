import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

import { CreateThreadForm } from '../../components/create-thread-form';

// ========== Mock redux hooks ==========
const dispatchMock = vi.fn();

vi.mock('@/redux/hooks', () => ({
  useAppDispatch: () => dispatchMock,
}));

// ========== Mock router navigate ==========
const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

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
vi.mock('../../schema/create-thread-schema', () => ({
  createThreadSchema: z.object({
    title: z.string().min(1, 'Title is required'),
    body: z.string().min(1, 'Body is required'),
    category: z.string().optional(),
  }),
}));

// ========== Mock action creator ==========
const createThreadMock = vi.fn((payload: any) => ({ type: 'threads/createThread', payload }));

vi.mock('../../redux/thread-slice', () => ({
  createThread: (payload: any) => createThreadMock(payload),
}));

// ========== Mock lucide icons ==========
vi.mock('lucide-react', () => ({
  Baseline: (props: any) => <svg data-testid='icon-baseline' {...props} />,
  Tag: (props: any) => <svg data-testid='icon-tag' {...props} />,
  MessageCircleMore: (props: any) => <svg data-testid='icon-message' {...props} />,
}));

// ========== Mock UI components (shadcn wrappers) ==========
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...rest }: any) => <section {...rest}>{children}</section>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <footer>{children}</footer>,
}));

vi.mock('@/components/ui/field', () => ({
  FieldGroup: ({ children }: any) => <div data-testid='field-group'>{children}</div>,
  Field: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  FieldLabel: ({ children, ...rest }: any) => <label {...rest}>{children}</label>,
  FieldError: ({ errors }: any) => <div role='alert'>{errors?.[0]?.message ?? 'Invalid'}</div>,
}));

vi.mock('@/components/ui/input-group', () => ({
  InputGroup: ({ children }: any) => <div data-testid='input-group'>{children}</div>,
  InputGroupAddon: ({ children }: any) => <span data-testid='input-addon'>{children}</span>,
  InputGroupInput: (props: any) => <input {...props} />,
  InputGroupTextarea: (props: any) => <textarea {...props} />,
}));

function renderSubject() {
  render(<CreateThreadForm />);
}

function getTitleInput() {
  return screen.getByLabelText(/title/i) as HTMLInputElement;
}

function getCategoryInput() {
  return screen.getByLabelText(/category/i) as HTMLInputElement;
}

function getBodyTextarea() {
  return screen.getByLabelText(/body/i) as HTMLTextAreaElement;
}

describe('CreateThreadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render title/category/body fields and the submit button', () => {
      renderSubject();

      expect(getTitleInput()).toBeInTheDocument();
      expect(getCategoryInput()).toBeInTheDocument();
      expect(getBodyTextarea()).toBeInTheDocument();

      expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should show validation errors and not dispatch/toast/navigate when submitting empty required fields', async () => {
      const user = userEvent.setup();
      renderSubject();

      await user.click(screen.getByRole('button', { name: 'Post' }));

      const alerts = await screen.findAllByRole('alert');
      expect(alerts.map((a) => a.textContent)).toEqual(
        expect.arrayContaining(['Title is required', 'Body is required']),
      );

      expect(dispatchMock).not.toHaveBeenCalled();
      expect(createThreadMock).not.toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(toastErrorMock).not.toHaveBeenCalled();
    });
  });

  describe('submission', () => {
    it('should dispatch createThread, navigate to home, and show success toast on success', async () => {
      const user = userEvent.setup();

      dispatchMock.mockResolvedValueOnce({
        payload: { status: 'success', message: 'Thread created' },
      });

      renderSubject();

      await user.type(getTitleInput(), 'My thread title');
      await user.type(getCategoryInput(), 'react');
      await user.type(getBodyTextarea(), 'My thread body');
      await user.click(screen.getByRole('button', { name: 'Post' }));

      await waitFor(() => {
        expect(createThreadMock).toHaveBeenCalledWith({
          title: 'My thread title',
          category: 'react',
          body: 'My thread body',
        });
      });

      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'threads/createThread',
        payload: {
          title: 'My thread title',
          category: 'react',
          body: 'My thread body',
        },
      });

      expect(navigateMock).toHaveBeenCalledWith('/');
      expect(toastSuccessMock).toHaveBeenCalledWith('Thread created');
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it('should show error toast and not navigate on failure', async () => {
      const user = userEvent.setup();

      dispatchMock.mockResolvedValueOnce({
        payload: { status: 'error', message: 'Failed to create thread' },
      });

      renderSubject();

      await user.type(getTitleInput(), 'My thread title');
      await user.type(getBodyTextarea(), 'My thread body');
      await user.click(screen.getByRole('button', { name: 'Post' }));

      await waitFor(() => {
        expect(createThreadMock).toHaveBeenCalledWith({
          title: 'My thread title',
          category: '',
          body: 'My thread body',
        });
      });

      expect(toastErrorMock).toHaveBeenCalledWith('Failed to create thread');
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
