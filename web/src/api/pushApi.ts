import { api } from './client';

export function getVapidPublicKey() {
  return api.get<{ publicKey: string }>('/push/vapid-public-key');
}

export function registerPushSubscription(workspaceId: string, sub: PushSubscriptionJSON) {
  return api.post<{ id: string }>(`/push/subscriptions?workspaceId=${workspaceId}`, sub);
}
