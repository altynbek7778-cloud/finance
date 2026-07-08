import { Router } from 'express';
import type { Request, Response } from 'express';
import { aiParseRequestSchema } from '@adel/shared';
import { requireAuth } from '../middleware/auth.js';
import { workspaceAuth } from '../middleware/workspaceAuth.js';
import { validateBody } from '../middleware/validate.js';
import { aiParseRateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { parseTransactionText } from '../services/aiParseService.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, workspaceAuth('MEMBER'));

router.post(
  '/parse-transaction',
  aiParseRateLimit,
  validateBody(aiParseRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await parseTransactionText(req.workspaceId!, req.userId!, req.body.text);
    res.json(result);
  })
);

export default router;
