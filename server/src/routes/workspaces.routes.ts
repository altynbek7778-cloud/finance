import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  createWorkspaceSchema,
  renameWorkspaceSchema,
  createInviteSchema,
  updateMemberRoleSchema,
} from '@adel/shared';
import { requireAuth } from '../middleware/auth.js';
import { workspaceAuth } from '../middleware/workspaceAuth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logEvent } from '../services/auditService.js';
import * as workspaceService from '../services/workspaceService.js';

const router = Router();
router.use(requireAuth);

router.post(
  '/',
  validateBody(createWorkspaceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const workspace = await workspaceService.createWorkspace(req.userId!, req.body.name);
    await logEvent({ actorType: 'USER', action: 'workspace.create', userId: req.userId, workspaceId: workspace.id });
    res.status(201).json({ id: workspace.id, name: workspace.name, role: 'OWNER' });
  })
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await workspaceService.listWorkspacesForUser(req.userId!));
  })
);

router.get(
  '/:workspaceId',
  workspaceAuth('MEMBER'),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await workspaceService.getWorkspaceDetail(req.workspaceId!));
  })
);

router.patch(
  '/:workspaceId',
  workspaceAuth('OWNER'),
  validateBody(renameWorkspaceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const workspace = await workspaceService.renameWorkspace(req.workspaceId!, req.body.name);
    res.json({ id: workspace.id, name: workspace.name });
  })
);

router.delete(
  '/:workspaceId',
  workspaceAuth('OWNER'),
  asyncHandler(async (req: Request, res: Response) => {
    await workspaceService.deleteWorkspace(req.workspaceId!);
    await logEvent({ actorType: 'USER', action: 'workspace.delete', userId: req.userId, workspaceId: req.workspaceId });
    res.status(204).send();
  })
);

router.delete(
  '/:workspaceId/members/:userId',
  workspaceAuth('MEMBER'),
  asyncHandler(async (req: Request, res: Response) => {
    const target = req.params.userId;
    if (target !== req.userId && req.membershipRole !== 'OWNER') {
      return res.status(403).json({ error: 'forbidden', message: 'Only an owner can remove other members' });
    }
    await workspaceService.removeMember(req.workspaceId!, target, req.userId!);
    await logEvent({
      actorType: 'USER',
      action: 'workspace.member.remove',
      userId: req.userId,
      workspaceId: req.workspaceId,
      metadata: { targetUserId: target },
    });
    res.status(204).send();
  })
);

router.patch(
  '/:workspaceId/members/:userId',
  workspaceAuth('OWNER'),
  validateBody(updateMemberRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const member = await workspaceService.updateMemberRole(req.workspaceId!, req.params.userId, req.body.role);
    res.json({ userId: member.userId, role: member.role });
  })
);

router.get(
  '/:workspaceId/export',
  workspaceAuth('MEMBER'),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await workspaceService.exportWorkspaceData(req.workspaceId!));
  })
);

router.post(
  '/:workspaceId/invites',
  workspaceAuth('OWNER'),
  validateBody(createInviteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const invite = await workspaceService.createInvite(
      req.workspaceId!,
      req.userId!,
      req.body.role,
      req.body.expiresInDays
    );
    res.status(201).json({
      id: invite.id,
      code: invite.code,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
  })
);

router.get(
  '/:workspaceId/invites',
  workspaceAuth('OWNER'),
  asyncHandler(async (req: Request, res: Response) => {
    const invites = await workspaceService.listInvites(req.workspaceId!);
    res.json(invites.map((i) => ({ id: i.id, code: i.code, role: i.role, expiresAt: i.expiresAt })));
  })
);

router.delete(
  '/:workspaceId/invites/:inviteId',
  workspaceAuth('OWNER'),
  asyncHandler(async (req: Request, res: Response) => {
    await workspaceService.revokeInvite(req.workspaceId!, req.params.inviteId);
    res.status(204).send();
  })
);

export default router;
