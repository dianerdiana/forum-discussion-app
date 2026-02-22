import type z from 'zod';

import type { registerSchema } from '../schema/register-schema';

export type RegisterDataType = z.infer<typeof registerSchema>;
