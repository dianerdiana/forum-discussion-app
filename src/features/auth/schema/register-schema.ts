import z from 'zod';

export const registerSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string().optional(),
    email: z.string().email(),
    username: z.string().min(3),
    phone: z.string(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // error will be shown under confirmPassword field
  });
