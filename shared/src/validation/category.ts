import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  emoji: z.string().trim().min(1).max(8),
  type: z.enum(['EXPENSE', 'INCOME']),
});
export type CategoryInput = z.infer<typeof categorySchema>;
