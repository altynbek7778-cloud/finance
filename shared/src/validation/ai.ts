import { z } from 'zod';

export const aiParseRequestSchema = z.object({
  text: z.string().trim().min(1).max(300),
});
export type AiParseRequestInput = z.infer<typeof aiParseRequestSchema>;

export const aiParseResultSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  desc: z.string().max(300),
});
export type AiParseResult = z.infer<typeof aiParseResultSchema>;
