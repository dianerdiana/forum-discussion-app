import { useState } from 'react';
import { Controller, type SubmitErrorHandler, type SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeClosed, KeyRound, User2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { api } from '@/configs/api-config';
import { toApiError } from '@/configs/auth/jwt-service';
import { useAppDispatch } from '@/redux/hooks';
import { useAuth } from '@/utils/hooks/use-auth';

import { handleLogin } from '../redux/auth-slice';
import { loginSchema } from '../schema/login-schema';
import type { LoginDataType } from '../types/login-type';

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAuth();

  const { control, handleSubmit, setError } = useForm<LoginDataType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const toggleShowPassword = () => setShowPassword((prevState) => !prevState);

  const onSubmit: SubmitHandler<LoginDataType> = async (data: LoginDataType) => {
    try {
      const response = await api.login(data);

      if (response.data.status === 'success') {
        dispatch(handleLogin(response.data.data.token));
        auth.refreshAuth();
        navigate('/');
      }
    } catch (error) {
      setError('email', { type: 'validate' });
      setError('password', { type: 'validate' });
      const apiError = toApiError(error);
      console.log(apiError);
    }
  };

  const onInvalid: SubmitErrorHandler<LoginDataType> = (error) => console.log(error);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-center text-2xl'>Login to Continue</CardTitle>
        <CardDescription className='text-center'>Enter your email below to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form id='form-login' onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <FieldGroup>
            {/* Username */}
            <Controller
              control={control}
              name='email'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`form-login-${field.name}`}>
                    Email <span className='text-destructive'>*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={`form-login-${field.name}`}
                      aria-invalid={fieldState.invalid}
                      placeholder='example@dicoding.com'
                      autoComplete='off'
                    />
                    <InputGroupAddon>
                      <User2 />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name='password'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`form-login-${field.name}`}>
                    Password <span className='text-destructive'>*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={`form-login-${field.name}`}
                      aria-invalid={fieldState.invalid}
                      placeholder='Password'
                      autoComplete='off'
                      type={showPassword ? 'text' : 'password'}
                    />
                    <InputGroupAddon>
                      <KeyRound />
                    </InputGroupAddon>
                    <InputGroupAddon align='inline-end'>
                      <InputGroupButton onClick={toggleShowPassword}>
                        {showPassword ? <Eye /> : <EyeClosed />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field>
          <Button type='submit' form='form-login' className='block w-full'>
            Login
          </Button>
          <p className='text-muted-foreground text-sm text-center'>
            Don't have an account?{' '}
            <Link to='/register' className='text-primary'>
              Register
            </Link>
          </p>
        </Field>
      </CardFooter>
    </Card>
  );
};
