import { z } from 'zod';

export const budgetUpsertSchema = z.object({
  monthlyLimit: z.number().positive().max(999999999),
});
export type BudgetUpsertInput = z.infer<typeof budgetUpsertSchema>;

export const goalSchema = z.object({
  name: z.string().trim().min(1).max(100),
  targetAmount: z.number().positive().max(999999999),
  savedAmount: z.number().min(0).max(999999999).default(0),
});
export type GoalInput = z.infer<typeof goalSchema>;

export const goalUpdateSchema = goalSchema.partial();
