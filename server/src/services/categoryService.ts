import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import type { CategoryInput } from '@adel/shared';

export async function listCategories(workspaceId: string) {
  return prisma.category.findMany({
    where: { workspaceId, isArchived: false },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createCategory(workspaceId: string, input: CategoryInput) {
  return prisma.category.create({ data: { ...input, workspaceId } });
}

export async function updateCategory(workspaceId: string, categoryId: string, input: Partial<CategoryInput>) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, workspaceId } });
  if (!category) throw new HttpError(404, 'Category not found');
  return prisma.category.update({ where: { id: categoryId }, data: input });
}

export async function archiveCategory(workspaceId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, workspaceId } });
  if (!category) throw new HttpError(404, 'Category not found');
  await prisma.category.update({ where: { id: categoryId }, data: { isArchived: true } });
}
