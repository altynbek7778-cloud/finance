import { z } from 'zod';

export const transactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.number().positive().max(999999999),
  categoryId: z.string().min(1),
  description: z.string().trim().max(300).optional().nullable(),
  occurredAt: z.string().datetime().optional(),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const transactionUpdateSchema = transactionSchema.partial();

export const transactionQuerySchema = z.object({
  month: z.coerce.number().int().min(0).max(11).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  type: z.enum(['EXPENSE', 'INCOME']).optional(),
  categoryId: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const analyticsQuerySchema = z.object({
  period: z.enum(['month', 'quarter', 'year']).default('month'),
});
