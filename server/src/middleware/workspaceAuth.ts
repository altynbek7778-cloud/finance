import type { NextFunction, Request, Response } from 'express';
import { prisma, type Role } from '../lib/prisma.js';
import { HttpError } from './errorHandler.js';

const ROLE_RANK: Record<Role, number> = { MEMBER: 0, OWNER: 1 };

/**
 * Re-derives workspace membership from the DB on every request instead of trusting
 * the :workspaceId path param alone — the central IDOR guard for all workspace-scoped routes.
 * Returns 404 (not 403) for non-members so workspace existence isn't leaked.
 */
export function workspaceAuth(minRole: Role = 'MEMBER') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.params.workspaceId;
      if (!req.userId || !workspaceId) throw new HttpError(404, 'Workspace not found');

      const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: req.userId } },
      });

      if (!membership) throw new HttpError(404, 'Workspace not found');
      if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
        throw new HttpError(403, 'Insufficient role for this action');
      }

      req.workspaceId = workspaceId;
      req.membershipRole = membership.role;
      next();
    } catch (err) {
      next(err);
    }
  };
}
