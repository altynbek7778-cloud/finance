import { Router } from 'express';
import type { Request, Response } from 'express';
import { categorySchema } from '@adel/shared';
import { requireAuth } from '../middleware/auth.js';
import { workspaceAuth } from '../middleware/workspaceAuth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as categoryService from '../services/categoryService.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, workspaceAuth('MEMBER'));

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await categoryService.listCategories(req.workspaceId!));
  })
);

router.post(
  '/',
  validateBody(categorySchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await categoryService.createCategory(req.workspaceId!, req.body));
  })
);

router.patch(
  '/:categoryId',
  validateBody(categorySchema.partial()),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await categoryService.updateCategory(req.workspaceId!, req.params.categoryId, req.body));
  })
);

router.delete(
  '/:categoryId',
  asyncHandler(async (req: Request, res: Response) => {
    await categoryService.archiveCategory(req.workspaceId!, req.params.categoryId);
    res.status(204).send();
  })
);

export default router;
