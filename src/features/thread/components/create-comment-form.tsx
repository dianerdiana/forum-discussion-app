import { Controller, type SubmitHandler, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch } from '@/redux/hooks';

import { createComment } from '../redux/thread-slice';
import { createCommentSchema } from '../schema/create-comment-schema';
import type { CreateCommentType } from '../types/create-comment-type';

type CreateCommentFormProps = { threadId: string; totalComments: number };

export const CreateCommentForm = ({ threadId, totalComments }: CreateCommentFormProps) => {
  const { control, handleSubmit, reset } = useForm<CreateCommentType>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: '',
    },
  });

  const dispatch = useAppDispatch();

  const onSubmit: SubmitHandler<CreateCommentType> = async (data) => {
    const response = await dispatch(createComment({ content: data.content, threadId }));
    const payload = response.payload as any;

    if (payload.status === 'success') {
      reset();
      toast.success(payload.message);
    } else {
      toast.error(payload.message);
    }
  };

  return (
    <Card className='min-w-sm'>
      <CardHeader>
        <CardTitle className='text-xl'>Comments ({totalComments})</CardTitle>
      </CardHeader>
      <CardContent>
        <form id='create-comment-form' onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Content */}
            <Controller
              control={control}
              name='content'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Textarea
                    {...field}
                    id={`create-comment-form-${field.name}`}
                    aria-invalid={fieldState.invalid}
                    placeholder='Comment...'
                    autoComplete='off'
                    className='min-h-26'
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field>
          <Button type='submit' form='create-comment-form' className='block w-full'>
            Send
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
};
