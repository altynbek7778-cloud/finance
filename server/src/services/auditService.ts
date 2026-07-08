import { prisma, Prisma, type ActorType, type LogLevel } from '../lib/prisma.js';

export function logEvent(params: {
  actorType: ActorType;
  action: string;
  level?: LogLevel;
  userId?: string | null;
  workspaceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { actorType, action, level = 'INFO', userId = null, workspaceId = null, metadata } = params;
  return prisma.eventLog
    .create({
      data: {
        actorType,
        action,
        level,
        userId,
        workspaceId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    })
    .catch((err) => console.error('Failed to write audit log', err));
}
