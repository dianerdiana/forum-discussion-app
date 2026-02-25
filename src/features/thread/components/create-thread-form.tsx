import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { Baseline, MessageCircleMore, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea } from '@/components/ui/input-group';
import { useAppDispatch } from '@/redux/hooks';

import { createThread } from '../redux/thread-slice';
import { createThreadSchema } from '../schema/create-thread-schema';
import type { CreateThreadType } from '../types/create-thread-type';

export const CreateThreadForm = () => {
  const { control, handleSubmit } = useForm<CreateThreadType>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: {
      title: '',
      body: '',
      category: '',
    },
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<CreateThreadType> = async (data) => {
    const response = await dispatch(createThread(data));
    const payload = response.payload as any;

    if (payload.status === 'success') {
      navigate('/');
      toast.success(payload.message);
    } else {
      toast.error(payload.message);
    }
  };

  return (
    <Card className='min-w-lg'>
      <CardContent>
        <form id='create-thread-form' onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Title */}
            <Controller
              control={control}
              name='title'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`create-thread-form-${field.name}`}>
                    Title <span className='text-destructive'>*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={`create-thread-form-${field.name}`}
                      aria-invalid={fieldState.invalid}
                      placeholder='Title...'
                      autoComplete='off'
                    />
                    <InputGroupAddon>
                      <Baseline />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Thread Category */}
            <Controller
              control={control}
              name='category'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`create-thread-form-${field.name}`}>Category</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={`create-thread-form-${field.name}`}
                      aria-invalid={fieldState.invalid}
                      placeholder='Category'
                      autoComplete='off'
                    />
                    <InputGroupAddon>
                      <Tag />
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Thread Body */}
            <Controller
              control={control}
              name='body'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`create-thread-form-${field.name}`}>
                    Body <span className='text-destructive'>*</span>
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id={`create-thread-form-${field.name}`}
                      aria-invalid={fieldState.invalid}
                      placeholder='Body...'
                      autoComplete='off'
                      className='min-h-26'
                    />
                    <InputGroupAddon>
                      <MessageCircleMore />
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
          <Button type='submit' form='create-thread-form' className='block w-full'>
            Post
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
};
