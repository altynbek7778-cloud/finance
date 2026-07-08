export type Role = 'OWNER' | 'MEMBER';
export type TxType = 'EXPENSE' | 'INCOME';
export type TxSource = 'MANUAL' | 'AI';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatarColor: string | null;
}

export interface WorkspaceSummaryDTO {
  id: string;
  name: string;
  role: Role;
}

export interface MemberDTO {
  userId: string;
  name: string;
  email: string;
  role: Role;
  displayColor: string | null;
  joinedAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  emoji: string;
  type: TxType;
}

export interface TransactionDTO {
  id: string;
  userId: string;
  userName: string;
  categoryId: string;
  type: TxType;
  amount: number;
  description: string | null;
  occurredAt: string;
  source: TxSource;
  createdAt: string;
}

export interface BudgetDTO {
  categoryId: string;
  monthlyLimit: number;
  spentThisMonth: number;
}

export interface GoalDTO {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
}

export interface AnalyticsDTO {
  period: 'month' | 'quarter' | 'year';
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
  expenseByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  monthlyTrend: { month: string; year: number; income: number; expense: number }[];
  byMember: { userId: string; name: string; expense: number; income: number }[];
}

export interface InviteDTO {
  id: string;
  code: string;
  role: Role;
  expiresAt: string;
  usedAt: string | null;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: unknown;
}
