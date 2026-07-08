import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { notifyWorkspace, getVapidPublicKey } from '../services/pushService.js';

function formatTenge(n: number): string {
  return '₸' + Math.round(n).toLocaleString('ru-RU');
}

export async function sendWeeklySummaries() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const workspaces = await prisma.workspace.findMany({
    where: { transactions: { some: { occurredAt: { gte: since }, deletedAt: null } } },
    select: { id: true },
  });

  for (const workspace of workspaces) {
    const txs = await prisma.transaction.findMany({
      where: { workspaceId: workspace.id, occurredAt: { gte: since }, deletedAt: null },
    });
    const income = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount.toNumber(), 0);
    const expense = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount.toNumber(), 0);

    await notifyWorkspace(workspace.id, {
      title: 'Итоги недели',
      body: `Доходы: ${formatTenge(income)} · Расходы: ${formatTenge(expense)}`,
    });
  }
}

export function scheduleWeeklySummaryJob() {
  if (!getVapidPublicKey()) return;
  // Sundays at 19:00 server time
  cron.schedule('0 19 * * 0', () => {
    sendWeeklySummaries().catch((err) => console.error('Weekly summary job failed', err));
  });
}
