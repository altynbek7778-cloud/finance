import { prisma, type Role } from '../lib/prisma.js';
import { generateInviteCode } from '../lib/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';

const DEFAULT_CATEGORIES: { name: string; emoji: string; type: 'EXPENSE' | 'INCOME' }[] = [
  { name: 'Продукты', emoji: '🛒', type: 'EXPENSE' },
  { name: 'Транспорт', emoji: '🚌', type: 'EXPENSE' },
  { name: 'Рестораны', emoji: '🍽️', type: 'EXPENSE' },
  { name: 'Развлечения', emoji: '🎮', type: 'EXPENSE' },
  { name: 'Здоровье', emoji: '💊', type: 'EXPENSE' },
  { name: 'Одежда', emoji: '👕', type: 'EXPENSE' },
  { name: 'Коммуналка', emoji: '🏠', type: 'EXPENSE' },
  { name: 'Образование', emoji: '📚', type: 'EXPENSE' },
  { name: 'Зарплата', emoji: '💼', type: 'INCOME' },
  { name: 'Фриланс', emoji: '💻', type: 'INCOME' },
  { name: 'Инвестиции', emoji: '📈', type: 'INCOME' },
  { name: 'Прочее', emoji: '💰', type: 'INCOME' },
];

export async function createWorkspace(userId: string, name: string) {
  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: { name, createdById: userId } });
    await tx.workspaceMember.create({
      data: { workspaceId: workspace.id, userId, role: 'OWNER' },
    });
    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, workspaceId: workspace.id })),
    });
    return workspace;
  });
}

export async function listWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { joinedAt: 'asc' },
  });
  return memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role }));
}

export async function getWorkspaceDetail(workspaceId: string) {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  });
  return {
    id: workspace.id,
    name: workspace.name,
    members: members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      displayColor: m.displayColor ?? m.user.avatarColor,
      joinedAt: m.joinedAt,
    })),
  };
}

export async function renameWorkspace(workspaceId: string, name: string) {
  return prisma.workspace.update({ where: { id: workspaceId }, data: { name } });
}

export async function deleteWorkspace(workspaceId: string) {
  await prisma.workspace.delete({ where: { id: workspaceId } });
}

export async function removeMember(workspaceId: string, targetUserId: string, requesterId: string) {
  if (targetUserId === requesterId) {
    // leaving is always allowed, but an owner can't leave if they're the last owner
    const owners = await prisma.workspaceMember.count({ where: { workspaceId, role: 'OWNER' } });
    const self = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (self?.role === 'OWNER' && owners <= 1) {
      throw new HttpError(400, 'Assign another owner before leaving the workspace');
    }
  }
  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });
}

export async function updateMemberRole(workspaceId: string, targetUserId: string, role: Role) {
  if (role === 'MEMBER') {
    const owners = await prisma.workspaceMember.count({ where: { workspaceId, role: 'OWNER' } });
    const target = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (target?.role === 'OWNER' && owners <= 1) {
      throw new HttpError(400, 'Workspace must keep at least one owner');
    }
  }
  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { role },
  });
}

export async function createInvite(workspaceId: string, createdById: string, role: Role, expiresInDays: number) {
  return prisma.invite.create({
    data: {
      workspaceId,
      createdById,
      role,
      code: generateInviteCode(),
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    },
  });
}

export async function listInvites(workspaceId: string) {
  return prisma.invite.findMany({ where: { workspaceId, usedAt: null }, orderBy: { expiresAt: 'asc' } });
}

export async function revokeInvite(workspaceId: string, inviteId: string) {
  await prisma.invite.deleteMany({ where: { id: inviteId, workspaceId, usedAt: null } });
}

export async function previewInvite(code: string) {
  const invite = await prisma.invite.findUnique({ where: { code }, include: { workspace: true } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    throw new HttpError(404, 'Invite not found or expired');
  }
  return { workspaceName: invite.workspace.name };
}

export async function exportWorkspaceData(workspaceId: string) {
  const [workspace, categories, transactions, budgets, goals] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    prisma.category.findMany({ where: { workspaceId } }),
    prisma.transaction.findMany({ where: { workspaceId, deletedAt: null }, include: { user: true } }),
    prisma.budget.findMany({ where: { workspaceId } }),
    prisma.goal.findMany({ where: { workspaceId } }),
  ]);

  return {
    workspace: { id: workspace.id, name: workspace.name, exportedAt: new Date().toISOString() },
    categories,
    transactions: transactions.map((t) => ({ ...t, amount: t.amount.toNumber(), userName: t.user.name })),
    budgets: budgets.map((b) => ({ ...b, monthlyLimit: b.monthlyLimit.toNumber() })),
    goals: goals.map((g) => ({ ...g, targetAmount: g.targetAmount.toNumber(), savedAmount: g.savedAmount.toNumber() })),
  };
}

export async function acceptInvite(code: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.invite.findUnique({ where: { code } });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      throw new HttpError(404, 'Invite not found or expired');
    }

    const existingMembership = await tx.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
    });

    if (!existingMembership) {
      await tx.workspaceMember.create({
        data: { workspaceId: invite.workspaceId, userId, role: invite.role },
      });
    }

    await tx.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedByUserId: userId },
    });

    return { workspaceId: invite.workspaceId, inviterId: invite.createdById };
  });
}
