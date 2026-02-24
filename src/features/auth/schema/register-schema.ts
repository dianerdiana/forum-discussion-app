import z from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, { error: 'Name is Required' }),
  email: z.email(),
  password: z.string().min(6),
});
