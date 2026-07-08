import webpush from 'web-push';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  return env.VAPID_PUBLIC_KEY ?? null;
}

export async function saveSubscription(
  userId: string,
  workspaceId: string | null,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId, workspaceId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    update: { userId, workspaceId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, lastSeenAt: new Date() },
  });
}

export async function removeSubscription(userId: string, subscriptionId: string) {
  await prisma.pushSubscription.deleteMany({ where: { id: subscriptionId, userId } });
}

interface NotifyPayload {
  title: string;
  body: string;
  url?: string;
  excludeUserId?: string;
}

export async function notifyWorkspace(workspaceId: string, payload: NotifyPayload) {
  if (!ensureConfigured()) return;

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId, ...(payload.excludeUserId ? { userId: { not: payload.excludeUserId } } : {}) },
    select: { userId: true },
  });
  if (members.length === 0) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: members.map((m) => m.userId) } },
  });

  const body = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? '/' });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
        } else {
          console.error('Push send failed', err);
        }
      }
    })
  );
}
