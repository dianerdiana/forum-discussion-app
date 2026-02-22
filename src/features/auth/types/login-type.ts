import type z from 'zod';

import type { loginSchema } from '../schema/login-schema';

export type LoginDataType = z.infer<typeof loginSchema>;
