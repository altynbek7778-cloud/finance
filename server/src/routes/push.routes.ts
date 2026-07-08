import { Router } from 'express';
import type { Request, Response } from 'express';
import { pushSubscriptionSchema } from '@adel/shared';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import * as pushService from '../services/pushService.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/vapid-public-key',
  asyncHandler(async (_req: Request, res: Response) => {
    const key = pushService.getVapidPublicKey();
    if (!key) throw new HttpError(503, 'Push notifications are not configured on this server');
    res.json({ publicKey: key });
  })
);

router.post(
  '/subscriptions',
  validateBody(pushSubscriptionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestedWorkspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId : null;
    let workspaceId: string | null = null;
    if (requestedWorkspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: requestedWorkspaceId, userId: req.userId! } },
      });
      workspaceId = membership ? requestedWorkspaceId : null;
    }
    const sub = await pushService.saveSubscription(req.userId!, workspaceId, req.body);
    res.status(201).json({ id: sub.id });
  })
);

router.delete(
  '/subscriptions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await pushService.removeSubscription(req.userId!, req.params.id);
    res.status(204).send();
  })
);

export default router;
