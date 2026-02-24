import z from 'zod';

import type { createThreadSchema } from '../schema/create-thread-schema';

export type CreateThreadType = z.infer<typeof createThreadSchema>;
