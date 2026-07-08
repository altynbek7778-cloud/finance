import { prisma } from '../lib/prisma.js';
import { verifyPassword } from '../lib/password.js';
import { signAdminToken } from '../lib/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function loginAdmin(username: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) throw new HttpError(401, 'Invalid credentials');
  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid credentials');

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  return signAdminToken(admin.id);
}

export async function listWorkspaces() {
  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { members: true, transactions: true } } },
  });
  return workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    createdAt: w.createdAt,
    memberCount: w._count.members,
    transactionCount: w._count.transactions,
  }));
}

export async function getWorkspace(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: { include: { user: true } } },
  });
  if (!workspace) throw new HttpError(404, 'Workspace not found');

  const [transactionCount, lastTx] = await Promise.all([
    prisma.transaction.count({ where: { workspaceId, deletedAt: null } }),
    prisma.transaction.findFirst({ where: { workspaceId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
  ]);

  return {
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt,
    members: workspace.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    transactionCount,
    lastActivityAt: lastTx?.createdAt ?? null,
  };
}

export async function deleteWorkspace(workspaceId: string) {
  await prisma.workspace.delete({ where: { id: workspaceId } });
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { memberships: { include: { workspace: true } } },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isDisabled: u.isDisabled,
    createdAt: u.createdAt,
    workspaces: u.memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role })),
  }));
}

export async function setUserDisabled(userId: string, isDisabled: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { isDisabled } });
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}

export async function getStats() {
  const [userCount, workspaceCount, transactionCount, last7dSignups] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.transaction.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);
  return { userCount, workspaceCount, transactionCount, last7dSignups };
}

export async function listEvents(filters: { level?: 'INFO' | 'WARN' | 'ERROR'; workspaceId?: string; userId?: string }) {
  return prisma.eventLog.findMany({
    where: {
      level: filters.level,
      workspaceId: filters.workspaceId,
      userId: filters.userId,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}
