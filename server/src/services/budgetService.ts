import { prisma, Prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getCategorySpentThisMonth } from './transactionService.js';

function toNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

export async function getBudgetForCategory(workspaceId: string, categoryId: string) {
  const budget = await prisma.budget.findUnique({ where: { workspaceId_categoryId: { workspaceId, categoryId } } });
  return budget ? { categoryId: budget.categoryId, monthlyLimit: toNumber(budget.monthlyLimit) } : null;
}

export async function listBudgets(workspaceId: string) {
  const budgets = await prisma.budget.findMany({ where: { workspaceId } });
  return Promise.all(
    budgets.map(async (b) => ({
      categoryId: b.categoryId,
      monthlyLimit: toNumber(b.monthlyLimit),
      spentThisMonth: await getCategorySpentThisMonth(workspaceId, b.categoryId),
    }))
  );
}

export async function upsertBudget(workspaceId: string, categoryId: string, monthlyLimit: number) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, workspaceId, type: 'EXPENSE' } });
  if (!category) throw new HttpError(400, 'Category must be an expense category in this workspace');

  const budget = await prisma.budget.upsert({
    where: { workspaceId_categoryId: { workspaceId, categoryId } },
    create: { workspaceId, categoryId, monthlyLimit: new Prisma.Decimal(monthlyLimit) },
    update: { monthlyLimit: new Prisma.Decimal(monthlyLimit) },
  });
  return { categoryId: budget.categoryId, monthlyLimit: toNumber(budget.monthlyLimit) };
}

export async function deleteBudget(workspaceId: string, categoryId: string) {
  await prisma.budget.deleteMany({ where: { workspaceId, categoryId } });
}

export async function listGoals(workspaceId: string) {
  const goals = await prisma.goal.findMany({ where: { workspaceId }, orderBy: { createdAt: 'asc' } });
  return goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: toNumber(g.targetAmount),
    savedAmount: toNumber(g.savedAmount),
  }));
}

export async function createGoal(workspaceId: string, input: { name: string; targetAmount: number; savedAmount: number }) {
  const goal = await prisma.goal.create({
    data: {
      workspaceId,
      name: input.name,
      targetAmount: new Prisma.Decimal(input.targetAmount),
      savedAmount: new Prisma.Decimal(input.savedAmount),
    },
  });
  return { id: goal.id, name: goal.name, targetAmount: toNumber(goal.targetAmount), savedAmount: toNumber(goal.savedAmount) };
}

export async function updateGoal(
  workspaceId: string,
  goalId: string,
  input: Partial<{ name: string; targetAmount: number; savedAmount: number }>
) {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, workspaceId } });
  if (!existing) throw new HttpError(404, 'Goal not found');

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      name: input.name,
      targetAmount: input.targetAmount !== undefined ? new Prisma.Decimal(input.targetAmount) : undefined,
      savedAmount: input.savedAmount !== undefined ? new Prisma.Decimal(input.savedAmount) : undefined,
    },
  });
  return { id: goal.id, name: goal.name, targetAmount: toNumber(goal.targetAmount), savedAmount: toNumber(goal.savedAmount) };
}

export async function deleteGoal(workspaceId: string, goalId: string) {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, workspaceId } });
  if (!existing) throw new HttpError(404, 'Goal not found');
  await prisma.goal.delete({ where: { id: goalId } });
}
