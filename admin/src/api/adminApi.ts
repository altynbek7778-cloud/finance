import { api } from './client';

export interface AdminWorkspaceSummary {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  transactionCount: number;
}

export interface AdminWorkspaceDetail {
  id: string;
  name: string;
  createdAt: string;
  members: { userId: string; name: string; email: string; role: string; joinedAt: string }[];
  transactionCount: number;
  lastActivityAt: string | null;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  isDisabled: boolean;
  createdAt: string;
  workspaces: { id: string; name: string; role: string }[];
}

export interface AdminStats {
  userCount: number;
  workspaceCount: number;
  transactionCount: number;
  last7dSignups: number;
}

export interface AdminEvent {
  id: string;
  workspaceId: string | null;
  userId: string | null;
  actorType: string;
  action: string;
  level: string;
  metadata: unknown;
  createdAt: string;
}

export const listWorkspaces = () => api.get<AdminWorkspaceSummary[]>('/admin/workspaces');
export const getWorkspace = (id: string) => api.get<AdminWorkspaceDetail>(`/admin/workspaces/${id}`);
export const deleteWorkspace = (id: string) => api.delete(`/admin/workspaces/${id}`);

export const listUsers = () => api.get<AdminUserSummary[]>('/admin/users');
export const disableUser = (id: string) => api.patch(`/admin/users/${id}/disable`);
export const enableUser = (id: string) => api.patch(`/admin/users/${id}/enable`);
export const deleteUser = (id: string) => api.delete(`/admin/users/${id}`);

export const getStats = () => api.get<AdminStats>('/admin/stats');
export const listEvents = () => api.get<AdminEvent[]>('/admin/events');
