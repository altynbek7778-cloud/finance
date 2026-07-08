import { prisma, Prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import type { TransactionInput } from '@adel/shared';

function toNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

function toTxDTO(tx: {
  id: string;
  userId: string;
  user: { name: string };
  categoryId: string;
  type: string;
  amount: Prisma.Decimal;
  description: string | null;
  occurredAt: Date;
  source: string;
  createdAt: Date;
}) {
  return {
    id: tx.id,
    userId: tx.userId,
    userName: tx.user.name,
    categoryId: tx.categoryId,
    type: tx.type,
    amount: toNumber(tx.amount),
    description: tx.description,
    occurredAt: tx.occurredAt.toISOString(),
    source: tx.source,
    createdAt: tx.createdAt.toISOString(),
  };
}

async function assertCategoryInWorkspace(workspaceId: string, categoryId: string, type?: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, workspaceId } });
  if (!category) throw new HttpError(400, 'Category does not belong to this workspace');
  if (type && category.type !== type) throw new HttpError(400, 'Category type does not match transaction type');
  return category;
}

export async function createTransaction(workspaceId: string, userId: string, input: TransactionInput) {
  await assertCategoryInWorkspace(workspaceId, input.categoryId, input.type);
  const tx = await prisma.transaction.create({
    data: {
      workspaceId,
      userId,
      categoryId: input.categoryId,
      type: input.type,
      amount: new Prisma.Decimal(input.amount),
      description: input.description ?? null,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    },
    include: { user: true },
  });
  return toTxDTO(tx);
}

export async function updateTransaction(
  workspaceId: string,
  txId: string,
  input: Partial<TransactionInput>
) {
  const existing = await prisma.transaction.findFirst({ where: { id: txId, workspaceId, deletedAt: null } });
  if (!existing) throw new HttpError(404, 'Transaction not found');

  if (input.categoryId) {
    await assertCategoryInWorkspace(workspaceId, input.categoryId, input.type ?? existing.type);
  }

  const tx = await prisma.transaction.update({
    where: { id: txId },
    data: {
      type: input.type,
      categoryId: input.categoryId,
      amount: input.amount !== undefined ? new Prisma.Decimal(input.amount) : undefined,
      description: input.description,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
    },
    include: { user: true },
  });
  return toTxDTO(tx);
}

export async function softDeleteTransaction(workspaceId: string, txId: string) {
  const existing = await prisma.transaction.findFirst({ where: { id: txId, workspaceId, deletedAt: null } });
  if (!existing) throw new HttpError(404, 'Transaction not found');
  await prisma.transaction.update({ where: { id: txId }, data: { deletedAt: new Date() } });
}

interface ListFilters {
  month?: number;
  year?: number;
  type?: 'EXPENSE' | 'INCOME';
  categoryId?: string;
  userId?: string;
  page: number;
  pageSize: number;
}

export async function listTransactions(workspaceId: string, filters: ListFilters) {
  const where: Prisma.TransactionWhereInput = { workspaceId, deletedAt: null };
  if (filters.type) where.type = filters.type;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.year !== undefined) {
    const month = filters.month ?? 0;
    const spanMonths = filters.month !== undefined ? 1 : 12;
    const start = new Date(Date.UTC(filters.year, month, 1));
    const end = new Date(Date.UTC(filters.year, month + spanMonths, 1));
    where.occurredAt = { gte: start, lt: end };
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { user: true },
      orderBy: { occurredAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items: items.map(toTxDTO), total, page: filters.page, pageSize: filters.pageSize };
}

function monthRange(year: number, month: number) {
  return { start: new Date(Date.UTC(year, month, 1)), end: new Date(Date.UTC(year, month + 1, 1)) };
}

export async function getCategorySpentThisMonth(workspaceId: string, categoryId: string): Promise<number> {
  const now = new Date();
  const { start, end } = monthRange(now.getUTCFullYear(), now.getUTCMonth());
  const result = await prisma.transaction.aggregate({
    where: { workspaceId, categoryId, type: 'EXPENSE', deletedAt: null, occurredAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return result._sum.amount ? toNumber(result._sum.amount) : 0;
}

function periodRange(period: 'month' | 'quarter' | 'year') {
  const now = new Date();
  const year = now.getUTCFullYear();
  if (period === 'month') return monthRange(year, now.getUTCMonth());
  if (period === 'quarter') {
    const q = Math.floor(now.getUTCMonth() / 3);
    return { start: new Date(Date.UTC(year, q * 3, 1)), end: new Date(Date.UTC(year, q * 3 + 3, 1)) };
  }
  return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
}

export async function getAnalytics(workspaceId: string, period: 'month' | 'quarter' | 'year') {
  const { start, end } = periodRange(period);
  const txs = await prisma.transaction.findMany({
    where: { workspaceId, deletedAt: null, occurredAt: { gte: start, lt: end } },
    include: { user: true },
  });

  let income = 0;
  let expense = 0;
  const expenseByCategory: Record<string, number> = {};
  const incomeByCategory: Record<string, number> = {};
  const byMemberMap = new Map<string, { name: string; expense: number; income: number }>();

  for (const tx of txs) {
    const amount = toNumber(tx.amount);
    const member = byMemberMap.get(tx.userId) ?? { name: tx.user.name, expense: 0, income: 0 };
    if (tx.type === 'EXPENSE') {
      expense += amount;
      expenseByCategory[tx.categoryId] = (expenseByCategory[tx.categoryId] ?? 0) + amount;
      member.expense += amount;
    } else {
      income += amount;
      incomeByCategory[tx.categoryId] = (incomeByCategory[tx.categoryId] ?? 0) + amount;
      member.income += amount;
    }
    byMemberMap.set(tx.userId, member);
  }

  const savings = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const now = new Date();
  const monthlyTrend = await Promise.all(
    Array.from({ length: 6 }, (_, i) => i).map(async (i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
      const { start: mStart, end: mEnd } = monthRange(d.getUTCFullYear(), d.getUTCMonth());
      const agg = await prisma.transaction.groupBy({
        by: ['type'],
        where: { workspaceId, deletedAt: null, occurredAt: { gte: mStart, lt: mEnd } },
        _sum: { amount: true },
      });
      const inc = agg.find((a) => a.type === 'INCOME')?._sum.amount;
      const exp = agg.find((a) => a.type === 'EXPENSE')?._sum.amount;
      return {
        month: monthNames[d.getUTCMonth()],
        year: d.getUTCFullYear(),
        income: inc ? toNumber(inc) : 0,
        expense: exp ? toNumber(exp) : 0,
      };
    })
  );

  return {
    period,
    income,
    expense,
    savings,
    savingsRate,
    expenseByCategory,
    incomeByCategory,
    monthlyTrend,
    byMember: Array.from(byMemberMap.entries()).map(([userId, v]) => ({ userId, ...v })),
  };
}
