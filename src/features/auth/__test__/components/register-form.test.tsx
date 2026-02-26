import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

import { RegisterForm } from '../../components/register-form';

// ========= Router =========
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

// ========= Toast =========
const toastPromiseMock = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    promise: (promise: Promise<any>, opts: any) => toastPromiseMock(promise, opts),
  },
}));

// ========= API + Error mapper =========
const apiRegisterMock = vi.fn();

vi.mock('@/configs/api-config', () => ({
  api: {
    register: (...args: any[]) => apiRegisterMock(...args),
  },
}));

vi.mock('@/configs/auth/jwt-service', () => ({
  toApiError: (e: unknown) => ({
    message: 'Mocked API Error',
    original: e,
  }),
}));

// ========= Schema (deterministic messages) =========
vi.mock('../../schema/register-schema', () => ({
  registerSchema: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
}));

// ========= Icons =========
vi.mock('lucide-react', () => ({
  Eye: (props: any) => <svg data-testid='icon-eye' {...props} />,
  EyeClosed: (props: any) => <svg data-testid='icon-eye-closed' {...props} />,
  KeyRound: (props: any) => <svg data-testid='icon-key' {...props} />,
  Mail: (props: any) => <svg data-testid='icon-mail' {...props} />,
  User2: (props: any) => <svg data-testid='icon-user' {...props} />,
}));

// ========= UI Primitives =========
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
    <button type='button' data-testid='toggle-password' {...rest}>
      {children}
    </button>
  ),
  InputGroupInput: (props: any) => <input {...props} />,
}));

function renderSubject() {
  render(<RegisterForm />);
}

function getNameInput() {
  return screen.getByLabelText(/name/i, { selector: 'input' }) as HTMLInputElement;
}

function getEmailInput() {
  return screen.getByLabelText(/email/i, { selector: 'input' }) as HTMLInputElement;
}

function getPasswordInput() {
  return screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement;
}

function getRegisterButton() {
  return screen.getByRole('button', { name: /register/i }) as HTMLButtonElement;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: emulate sonner toast.promise lifecycle
    toastPromiseMock.mockImplementation((promise: Promise<any>, opts: any) => {
      return Promise.resolve(promise)
        .then((res) => opts?.success?.(res))
        .catch((err) => opts?.error?.(err))
        .finally(() => opts?.finally?.());
    });
  });

  it('should render inputs, submit button, and login link', () => {
    renderSubject();

    expect(getNameInput()).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();

    expect(getRegisterButton()).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderSubject();

    expect(getPasswordInput()).toHaveAttribute('type', 'password');

    await user.click(screen.getByTestId('toggle-password'));
    expect(getPasswordInput()).toHaveAttribute('type', 'text');

    await user.click(screen.getByTestId('toggle-password'));
    expect(getPasswordInput()).toHaveAttribute('type', 'password');
  });

  it('should show validation errors when submitting empty required fields', async () => {
    const user = userEvent.setup();
    renderSubject();

    await user.click(getRegisterButton());

    const alerts = await screen.findAllByRole('alert');
    const messages = alerts.map((a) => a.textContent);

    expect(messages).toEqual(expect.arrayContaining(['Name is required', 'Email is required', 'Password is required']));

    expect(apiRegisterMock).not.toHaveBeenCalled();
    expect(toastPromiseMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('should call api.register and navigate to "/login" when status is success', async () => {
    const user = userEvent.setup();

    apiRegisterMock.mockResolvedValueOnce({
      data: { status: 'success', message: 'Register success' },
    });

    renderSubject();

    await user.type(getNameInput(), 'John Doe');
    await user.type(getEmailInput(), 'john@example.com');
    await user.type(getPasswordInput(), 'secret');
    await user.click(getRegisterButton());

    await waitFor(() => {
      expect(apiRegisterMock).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret',
      });
      expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    });

    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('should not navigate when status is not success', async () => {
    const user = userEvent.setup();

    apiRegisterMock.mockResolvedValueOnce({
      data: { status: 'fail', message: 'Email already taken' },
    });

    renderSubject();

    await user.type(getNameInput(), 'John Doe');
    await user.type(getEmailInput(), 'john@example.com');
    await user.type(getPasswordInput(), 'secret');
    await user.click(getRegisterButton());

    await waitFor(() => {
      expect(apiRegisterMock).toHaveBeenCalledTimes(1);
      expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('should disable submit button while loading and enable it again after toast finally', async () => {
    const user = userEvent.setup();

    const d = deferred<any>();
    apiRegisterMock.mockReturnValueOnce(d.promise);

    renderSubject();

    await user.type(getNameInput(), 'John Doe');
    await user.type(getEmailInput(), 'john@example.com');
    await user.type(getPasswordInput(), 'secret');

    expect(getRegisterButton()).not.toBeDisabled();

    await user.click(getRegisterButton());

    // isLoading set synchronously before toast.promise is called
    expect(getRegisterButton()).toBeDisabled();

    d.resolve({ data: { status: 'success', message: 'Register success' } });

    await waitFor(() => {
      expect(getRegisterButton()).not.toBeDisabled();
    });
  });

  it('should not navigate when api.register rejects', async () => {
    const user = userEvent.setup();

    apiRegisterMock.mockRejectedValueOnce(new Error('network error'));

    renderSubject();

    await user.type(getNameInput(), 'John Doe');
    await user.type(getEmailInput(), 'john@example.com');
    await user.type(getPasswordInput(), 'secret');
    await user.click(getRegisterButton());

    await waitFor(() => {
      expect(apiRegisterMock).toHaveBeenCalledTimes(1);
      expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
