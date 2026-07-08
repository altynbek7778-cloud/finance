import type { Role } from '../lib/prisma.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      workspaceId?: string;
      membershipRole?: Role;
      adminId?: string;
    }
  }
}

export {};
