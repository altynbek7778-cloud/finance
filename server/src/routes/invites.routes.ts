import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logEvent } from '../services/auditService.js';
import * as workspaceService from '../services/workspaceService.js';
import * as pushService from '../services/pushService.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get(
  '/:code',
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await workspaceService.previewInvite(req.params.code));
  })
);

router.post(
  '/:code/accept',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId } = await workspaceService.acceptInvite(req.params.code, req.userId!);
    await logEvent({ actorType: 'USER', action: 'invite.accept', userId: req.userId, workspaceId });
    const joiner = await prisma.user.findUnique({ where: { id: req.userId! } });
    pushService
      .notifyWorkspace(workspaceId, {
        excludeUserId: req.userId,
        title: 'Новый участник',
        body: `${joiner?.name ?? 'Кто-то'} присоединился к вашему пространству`,
      })
      .catch((err) => console.error('Push notify failed', err));
    res.json({ workspaceId });
  })
);

export default router;
