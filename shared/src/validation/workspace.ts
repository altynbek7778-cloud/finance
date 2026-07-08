import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const renameWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const createInviteSchema = z.object({
  role: z.enum(['OWNER', 'MEMBER']).default('MEMBER'),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'MEMBER']),
});
