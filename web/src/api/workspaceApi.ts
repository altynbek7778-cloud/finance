import type {
  AnalyticsDTO,
  BudgetDTO,
  CategoryDTO,
  GoalDTO,
  InviteDTO,
  MemberDTO,
  TransactionDTO,
  TxType,
} from '@adel/shared';
import { api } from './client';

export function createWorkspace(name: string) {
  return api.post<{ id: string; name: string; role: 'OWNER' }>('/workspaces', { name });
}

export function getWorkspaceDetail(workspaceId: string) {
  return api.get<{ id: string; name: string; members: MemberDTO[] }>(`/workspaces/${workspaceId}`);
}

export function renameWorkspace(workspaceId: string, name: string) {
  return api.patch<{ id: string; name: string }>(`/workspaces/${workspaceId}`, { name });
}

export function removeMember(workspaceId: string, userId: string) {
  return api.delete(`/workspaces/${workspaceId}/members/${userId}`);
}

export function createInvite(workspaceId: string, role: 'OWNER' | 'MEMBER' = 'MEMBER', expiresInDays = 7) {
  return api.post<InviteDTO>(`/workspaces/${workspaceId}/invites`, { role, expiresInDays });
}

export function listInvites(workspaceId: string) {
  return api.get<InviteDTO[]>(`/workspaces/${workspaceId}/invites`);
}

export function revokeInvite(workspaceId: string, inviteId: string) {
  return api.delete(`/workspaces/${workspaceId}/invites/${inviteId}`);
}

export function previewInvite(code: string) {
  return api.get<{ workspaceName: string }>(`/invites/${code}`);
}

export function acceptInvite(code: string) {
  return api.post<{ workspaceId: string }>(`/invites/${code}/accept`);
}

export function listCategories(workspaceId: string) {
  return api.get<CategoryDTO[]>(`/workspaces/${workspaceId}/categories`);
}

export function createCategory(workspaceId: string, input: { name: string; emoji: string; type: TxType }) {
  return api.post<CategoryDTO>(`/workspaces/${workspaceId}/categories`, input);
}

export function updateCategory(
  workspaceId: string,
  categoryId: string,
  input: Partial<{ name: string; emoji: string; type: TxType }>
) {
  return api.patch<CategoryDTO>(`/workspaces/${workspaceId}/categories/${categoryId}`, input);
}

export function deleteCategory(workspaceId: string, categoryId: string) {
  return api.delete(`/workspaces/${workspaceId}/categories/${categoryId}`);
}

export interface TransactionListParams {
  month?: number;
  year?: number;
  type?: TxType;
  categoryId?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export function listTransactions(workspaceId: string, params: TransactionListParams = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return api.get<{ items: TransactionDTO[]; total: number; page: number; pageSize: number }>(
    `/workspaces/${workspaceId}/transactions${suffix}`
  );
}

export function getAnalytics(workspaceId: string, period: 'month' | 'quarter' | 'year') {
  return api.get<AnalyticsDTO>(`/workspaces/${workspaceId}/transactions/analytics?period=${period}`);
}

export interface TransactionInputPayload {
  type: TxType;
  amount: number;
  categoryId: string;
  description?: string | null;
  occurredAt?: string;
}

export function createTransaction(workspaceId: string, input: TransactionInputPayload) {
  return api.post<TransactionDTO>(`/workspaces/${workspaceId}/transactions`, input);
}

export function updateTransaction(workspaceId: string, txId: string, input: Partial<TransactionInputPayload>) {
  return api.patch<TransactionDTO>(`/workspaces/${workspaceId}/transactions/${txId}`, input);
}

export function deleteTransaction(workspaceId: string, txId: string) {
  return api.delete(`/workspaces/${workspaceId}/transactions/${txId}`);
}

export function listBudgets(workspaceId: string) {
  return api.get<BudgetDTO[]>(`/workspaces/${workspaceId}/budgets`);
}

export function upsertBudget(workspaceId: string, categoryId: string, monthlyLimit: number) {
  return api.put<BudgetDTO>(`/workspaces/${workspaceId}/budgets/${categoryId}`, { monthlyLimit });
}

export function deleteBudget(workspaceId: string, categoryId: string) {
  return api.delete(`/workspaces/${workspaceId}/budgets/${categoryId}`);
}

export function listGoals(workspaceId: string) {
  return api.get<GoalDTO[]>(`/workspaces/${workspaceId}/goals`);
}

export function createGoal(workspaceId: string, input: { name: string; targetAmount: number; savedAmount: number }) {
  return api.post<GoalDTO>(`/workspaces/${workspaceId}/goals`, input);
}

export function updateGoal(
  workspaceId: string,
  goalId: string,
  input: Partial<{ name: string; targetAmount: number; savedAmount: number }>
) {
  return api.patch<GoalDTO>(`/workspaces/${workspaceId}/goals/${goalId}`, input);
}

export function deleteGoal(workspaceId: string, goalId: string) {
  return api.delete(`/workspaces/${workspaceId}/goals/${goalId}`);
}

export function exportWorkspace(workspaceId: string) {
  return api.get<unknown>(`/workspaces/${workspaceId}/export`);
}

export interface AiParseResult {
  type: TxType;
  amount: number;
  categoryId: string;
  desc: string;
}

export function parseTransactionText(workspaceId: string, text: string) {
  return api.post<AiParseResult>(`/workspaces/${workspaceId}/ai/parse-transaction`, { text });
}
