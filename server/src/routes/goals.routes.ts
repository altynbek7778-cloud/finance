import { Router } from 'express';
import type { Request, Response } from 'express';
import { goalSchema, goalUpdateSchema } from '@adel/shared';
import { requireAuth } from '../middleware/auth.js';
import { workspaceAuth } from '../middleware/workspaceAuth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as budgetService from '../services/budgetService.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, workspaceAuth('MEMBER'));

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await budgetService.listGoals(req.workspaceId!));
  })
);

router.post(
  '/',
  validateBody(goalSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await budgetService.createGoal(req.workspaceId!, req.body));
  })
);

router.patch(
  '/:goalId',
  validateBody(goalUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await budgetService.updateGoal(req.workspaceId!, req.params.goalId, req.body));
  })
);

router.delete(
  '/:goalId',
  asyncHandler(async (req: Request, res: Response) => {
    await budgetService.deleteGoal(req.workspaceId!, req.params.goalId);
    res.status(204).send();
  })
);

export default router;
