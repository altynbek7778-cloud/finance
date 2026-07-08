import { Router } from 'express';
import type { Request, Response } from 'express';
import { transactionSchema, transactionUpdateSchema, transactionQuerySchema, analyticsQuerySchema } from '@adel/shared';
import { requireAuth } from '../middleware/auth.js';
import { workspaceAuth } from '../middleware/workspaceAuth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logEvent } from '../services/auditService.js';
import * as transactionService from '../services/transactionService.js';
import * as budgetService from '../services/budgetService.js';
import * as pushService from '../services/pushService.js';
import { prisma } from '../lib/prisma.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, workspaceAuth('MEMBER'));

function formatTenge(n: number): string {
  return '₸' + Math.round(n).toLocaleString('ru-RU');
}

async function notifyNewTransaction(workspaceId: string, actorId: string, tx: Awaited<ReturnType<typeof transactionService.createTransaction>>) {
  const kind = tx.type === 'EXPENSE' ? 'расход' : 'доход';
  pushService
    .notifyWorkspace(workspaceId, {
      excludeUserId: actorId,
      title: 'Новая операция',
      body: `${tx.userName} добавил(а) ${kind}: ${tx.description || 'без описания'} — ${formatTenge(tx.amount)}`,
    })
    .catch((err) => console.error('Push notify failed', err));

  if (tx.type !== 'EXPENSE') return;
  const budget = await budgetService.getBudgetForCategory(workspaceId, tx.categoryId);
  if (!budget) return;

  const spent = await transactionService.getCategorySpentThisMonth(workspaceId, tx.categoryId);
  const wasUnderBefore = spent - tx.amount <= budget.monthlyLimit;
  if (spent > budget.monthlyLimit && wasUnderBefore) {
    const category = await prisma.category.findUnique({ where: { id: tx.categoryId } });
    pushService
      .notifyWorkspace(workspaceId, {
        title: 'Бюджет превышен',
        body: `Бюджет по категории «${category?.name ?? tx.categoryId}» превышен в этом месяце`,
      })
      .catch((err) => console.error('Push notify failed', err));
  }
}

router.get(
  '/',
  validateQuery(transactionQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as {
      month?: number;
      year?: number;
      type?: 'EXPENSE' | 'INCOME';
      categoryId?: string;
      userId?: string;
      page: number;
      pageSize: number;
    };
    res.json(await transactionService.listTransactions(req.workspaceId!, q));
  })
);

router.get(
  '/analytics',
  validateQuery(analyticsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { period } = req.query as unknown as { period: 'month' | 'quarter' | 'year' };
    res.json(await transactionService.getAnalytics(req.workspaceId!, period));
  })
);

router.post(
  '/',
  validateBody(transactionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tx = await transactionService.createTransaction(req.workspaceId!, req.userId!, req.body);
    await logEvent({
      actorType: 'USER',
      action: 'transaction.create',
      userId: req.userId,
      workspaceId: req.workspaceId,
      metadata: { transactionId: tx.id, amount: tx.amount, type: tx.type },
    });
    notifyNewTransaction(req.workspaceId!, req.userId!, tx).catch((err) => console.error('Notify failed', err));
    res.status(201).json(tx);
  })
);

router.patch(
  '/:txId',
  validateBody(transactionUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await transactionService.updateTransaction(req.workspaceId!, req.params.txId, req.body));
  })
);

router.delete(
  '/:txId',
  asyncHandler(async (req: Request, res: Response) => {
    await transactionService.softDeleteTransaction(req.workspaceId!, req.params.txId);
    await logEvent({
      actorType: 'USER',
      action: 'transaction.delete',
      userId: req.userId,
      workspaceId: req.workspaceId,
      metadata: { transactionId: req.params.txId },
    });
    res.status(204).send();
  })
);

export default router;
