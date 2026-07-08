import { Router } from 'express';
import type { Request, Response } from 'express';
import { budgetUpsertSchema } from '@adel/shared';
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
    res.json(await budgetService.listBudgets(req.workspaceId!));
  })
);

router.put(
  '/:categoryId',
  validateBody(budgetUpsertSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await budgetService.upsertBudget(req.workspaceId!, req.params.categoryId, req.body.monthlyLimit));
  })
);

router.delete(
  '/:categoryId',
  asyncHandler(async (req: Request, res: Response) => {
    await budgetService.deleteBudget(req.workspaceId!, req.params.categoryId);
    res.status(204).send();
  })
);

export default router;
