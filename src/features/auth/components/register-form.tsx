import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeClosed, KeyRound, Mail, User2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { api } from '@/configs/api-config';
import { toApiError } from '@/configs/auth/jwt-service';

import { registerSchema } from '../schema/register-schema';
import type { RegisterDataType } from '../types/register-type';

export const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const { control, handleSubmit } = useForm<RegisterDataType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const toggleShowPassword = () => setShowPassword((prevState) => !prevState);

  const onSubmit: SubmitHandler<RegisterDataType> = async (data: RegisterDataType) => {
    setIsLoading(true);

    toast.promise(api.register(data), {
      loading: 'Logging in...',
      success: (response) => {
        if (response.data.status === 'success') {
          navigate('/login');
        }
        return response.data.message;
      },
      error: (error) => {
        const apiError = toApiError(error);
        return apiError.message;
      },
      finally: () => setIsLoading(false),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-center text-2xl'>Create an Account</CardTitle>
        <CardDescription className='text-center'>Enter your information below to create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form id='form-register' onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Name */}
            <Controller
              control={control}
              name='name'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`form-register-${field.name}`}>
                    Name <span className='text-destructive'>*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={`form-register-${field.name}`}
                      aria-invalid={fieldState.invalid}
                      placeholder='John Doe'
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

            {/* Email */}
            <Controller
              control={control}
              name='email'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`form-register-${field.name}`}>
                    Email <span className='text-destructive'>*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={`form-register-${field.name}`}
                      aria-invalid={fieldState.invalid}
                      placeholder='example@dicoding.com'
                      autoComplete='off'
                    />
                    <InputGroupAddon>
                      <Mail />
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
                  <FieldLabel htmlFor={`form-register-${field.name}`}>
                    Password <span className='text-destructive'>*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={`form-register-${field.name}`}
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
          <Button type='submit' form='form-register' className='block w-full' disabled={isLoading}>
            Register
          </Button>
          <p className='text-muted-foreground text-sm text-center'>
            Already have an account?{' '}
            <Link to='/login' className='text-primary'>
              Login
            </Link>
          </p>
        </Field>
      </CardFooter>
    </Card>
  );
};
