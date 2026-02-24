import z from 'zod';

export const createThreadSchema = z.object({
  title: z.string().min(1, { error: 'Title is required' }),
  body: z.string().min(1, { error: 'Body is required' }),
  category: z.string().optional(),
});
