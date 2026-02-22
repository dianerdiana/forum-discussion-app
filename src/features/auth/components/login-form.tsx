import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeClosed, KeyRound, User2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';

import { loginSchema } from '../schema/login-schema';
import type { LoginDataType } from '../types/login-type';

export const LoginForm = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { control, handleSubmit, setError } = useForm<LoginDataType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginDataType) => {
    console.log(data);
  };

  const toggleShowPassword = () => setShowPassword((prevState) => !prevState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-center text-2xl'>Login to Continue</CardTitle>
        <CardDescription className='text-center'>Enter your email below to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form id='form-signin' onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Username */}
            <Controller
              control={control}
              name='username'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`form-signin-${field.name}`}>
                    Username / Email <span className='text-destructive'>*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={`form-signin-${field.name}`}
                      aria-invalid={fieldState.invalid}
                      placeholder='username'
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
                  <FieldLabel htmlFor={`form-signin-${field.name}`}>
                    Password <span className='text-destructive'>*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={`form-signin-${field.name}`}
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
          <Button type='submit' form='form-signin' className='block w-full'>
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
