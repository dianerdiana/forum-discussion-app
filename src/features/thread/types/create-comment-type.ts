import z from 'zod';

import type { createCommentSchema } from '../schema/create-comment-schema';

export type CreateCommentType = z.infer<typeof createCommentSchema>;
