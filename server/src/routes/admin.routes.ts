import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import { adminAuthRateLimit } from '../middleware/rateLimit.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logEvent } from '../services/auditService.js';
import * as adminService from '../services/adminService.js';

const router = Router();

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

router.post(
  '/auth/login',
  adminAuthRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const token = await adminService.loginAdmin(req.body.username, req.body.password);
      await logEvent({ actorType: 'ADMIN', action: 'admin.login' });
      res.json({ accessToken: token });
    } catch (err) {
      await logEvent({
        actorType: 'ADMIN',
        action: 'admin.login_failed',
        level: 'WARN',
        metadata: { username: req.body?.username, ip: req.ip },
      });
      throw err;
    }
  })
);

router.use(requireAdminAuth);

router.post(
  '/auth/logout',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(204).send();
  })
);

router.get(
  '/workspaces',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await adminService.listWorkspaces());
  })
);

router.get(
  '/workspaces/:id',
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await adminService.getWorkspace(req.params.id));
  })
);

router.delete(
  '/workspaces/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteWorkspace(req.params.id);
    await logEvent({ actorType: 'ADMIN', action: 'admin.workspace.delete', workspaceId: req.params.id });
    res.status(204).send();
  })
);

router.get(
  '/users',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await adminService.listUsers());
  })
);

router.patch(
  '/users/:id/disable',
  asyncHandler(async (req: Request, res: Response) => {
    await adminService.setUserDisabled(req.params.id, true);
    await logEvent({ actorType: 'ADMIN', action: 'admin.user.disable', metadata: { userId: req.params.id } });
    res.status(204).send();
  })
);

router.patch(
  '/users/:id/enable',
  asyncHandler(async (req: Request, res: Response) => {
    await adminService.setUserDisabled(req.params.id, false);
    await logEvent({ actorType: 'ADMIN', action: 'admin.user.enable', metadata: { userId: req.params.id } });
    res.status(204).send();
  })
);

router.delete(
  '/users/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteUser(req.params.id);
    await logEvent({ actorType: 'ADMIN', action: 'admin.user.delete', metadata: { userId: req.params.id } });
    res.status(204).send();
  })
);

router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await adminService.getStats());
  })
);

const eventsQuerySchema = z.object({
  level: z.enum(['INFO', 'WARN', 'ERROR']).optional(),
  workspaceId: z.string().optional(),
  userId: z.string().optional(),
});

router.get(
  '/events',
  validateQuery(eventsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await adminService.listEvents(req.query as z.infer<typeof eventsQuerySchema>));
  })
);

export default router;
