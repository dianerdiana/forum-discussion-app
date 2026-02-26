import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

// ---- subject ----
import { LoginForm } from '../../components/login-form';

// ========== Mocks ==========

// router
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ to, children, ...rest }: any) => (
      <a href={typeof to === 'string' ? to : '#'} {...rest}>
        {children}
      </a>
    ),
  };
});

// redux
const dispatchMock = vi.fn();
vi.mock('@/redux/hooks', () => ({
  useAppDispatch: () => dispatchMock,
}));

// auth hook
const refreshAuthMock = vi.fn();
vi.mock('@/utils/hooks/use-auth', () => ({
  useAuth: () => ({
    refreshAuth: refreshAuthMock,
  }),
}));

// api + error mapper
const apiLoginMock = vi.fn();
vi.mock('@/configs/api-config', () => ({
  api: {
    login: (...args: any[]) => apiLoginMock(...args),
  },
}));

vi.mock('@/configs/auth/jwt-service', () => ({
  toApiError: (e: unknown) => ({
    message: 'Mocked API Error',
    original: e,
  }),
}));

// toast
const toastPromiseMock = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    promise: (promise: Promise<any>, opts: any) => toastPromiseMock(promise, opts),
  },
}));

// zod schema (deterministic messages)
vi.mock('../../schema/login-schema', () => ({
  loginSchema: z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
}));

// auth slice action
const handleLoginMock = vi.fn((token: string) => ({ type: 'auth/handleLogin', payload: token }));
vi.mock('../../redux/auth-slice', () => ({
  handleLogin: (token: string) => handleLoginMock(token),
}));

// lucide icons
vi.mock('lucide-react', () => ({
  Eye: (props: any) => <svg data-testid='icon-eye' {...props} />,
  EyeClosed: (props: any) => <svg data-testid='icon-eye-closed' {...props} />,
  KeyRound: (props: any) => <svg data-testid='icon-key' {...props} />,
  User2: (props: any) => <svg data-testid='icon-user' {...props} />,
}));

// UI primitives
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <section>{children}</section>,
  CardHeader: ({ children }: any) => <header>{children}</header>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <footer>{children}</footer>,
}));

vi.mock('@/components/ui/field', () => ({
  FieldGroup: ({ children }: any) => <div data-testid='field-group'>{children}</div>,
  Field: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  FieldLabel: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
  FieldError: ({ errors }: any) => <div role='alert'>{errors?.[0]?.message ?? 'Invalid'}</div>,
}));

vi.mock('@/components/ui/input-group', () => ({
  InputGroup: ({ children }: any) => <div data-testid='input-group'>{children}</div>,
  InputGroupAddon: ({ children }: any) => <span data-testid='input-addon'>{children}</span>,
  InputGroupButton: ({ children, ...rest }: any) => (
    <button type='button' {...rest}>
      {children}
    </button>
  ),
  InputGroupInput: (props: any) => <input {...props} />,
}));

function renderSubject() {
  render(<LoginForm />);
}

function getEmailInput() {
  return screen.getByLabelText(/email/i, { selector: 'input' }) as HTMLInputElement;
}

function getPasswordInput() {
  return screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement;
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // default toast.promise behavior: run the lifecycle based on promise outcome
    toastPromiseMock.mockImplementation((promise: Promise<any>, opts: any) => {
      // emulate sonner's behavior for success/error/finally callbacks
      return Promise.resolve(promise)
        .then((res) => opts?.success?.(res))
        .catch((err) => opts?.error?.(err))
        .finally(() => opts?.finally?.());
    });
  });

  it('should render inputs, submit button, and register link', () => {
    renderSubject();

    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderSubject();

    expect(getPasswordInput()).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'toggle-password' }));
    expect(getPasswordInput()).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'toggle-password' }));
    expect(getPasswordInput()).toHaveAttribute('type', 'password');
  });

  it('should show validation errors when submit with empty fields', async () => {
    const user = userEvent.setup();
    renderSubject();

    await user.click(screen.getByRole('button', { name: /login/i }));

    // zodResolver should block onSubmit and render field errors
    const alerts = await screen.findAllByRole('alert');
    const messages = alerts.map((a) => a.textContent);

    expect(messages).toEqual(expect.arrayContaining(['Email is required', 'Password is required']));

    expect(apiLoginMock).not.toHaveBeenCalled();
    expect(toastPromiseMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('should call api.login and on success dispatch handleLogin, refreshAuth, and navigate to "/"', async () => {
    const user = userEvent.setup();

    apiLoginMock.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'Login success',
        data: { token: 'token-123' },
      },
    });

    renderSubject();

    await user.type(getEmailInput(), 'user@example.com');
    await user.type(getPasswordInput(), 'secret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(apiLoginMock).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret' });
      expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    });

    expect(handleLoginMock).toHaveBeenCalledWith('token-123');
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'auth/handleLogin', payload: 'token-123' });
    expect(refreshAuthMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('should not dispatch/navigate if response status is not "success"', async () => {
    const user = userEvent.setup();

    apiLoginMock.mockResolvedValueOnce({
      data: {
        status: 'fail',
        message: 'Invalid credentials',
        data: { token: 'token-should-not-be-used' },
      },
    });

    renderSubject();

    await user.type(getEmailInput(), 'user@example.com');
    await user.type(getPasswordInput(), 'wrong');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(apiLoginMock).toHaveBeenCalledTimes(1);
      expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    });

    expect(handleLoginMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(refreshAuthMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('should set field errors and not navigate when api.login rejects', async () => {
    const user = userEvent.setup();

    apiLoginMock.mockRejectedValueOnce(new Error('network error'));

    renderSubject();

    await user.type(getEmailInput(), 'user@example.com');
    await user.type(getPasswordInput(), 'secret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(apiLoginMock).toHaveBeenCalledTimes(1);
      expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    });

    // on error it sets both fields to invalid; FieldError should render
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(2);

    expect(dispatchMock).not.toHaveBeenCalled();
    expect(refreshAuthMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
