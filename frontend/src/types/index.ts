export type Role = 'ADMIN' | 'MEMBER';

export type Category = 'SWEET' | 'SAVOURY' | 'DRINK' | 'HEALTHY_ISH';

export type SnackStatus = 'STOCKED' | 'RUNNING_LOW' | 'GONE';

export type Action = 'RESTOCKED' | 'CONSUMED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Snack {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  lowStockThreshold: number;
  status: SnackStatus;
  voteCount: number;
  hasVoted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string | null;
  snackId: string | null;
  action: Action;
  amount: number;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  snack: { id: string; name: string; category: Category } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SnackSummary {
  total: number;
  stocked: number;
  runningLow: number;
  gone: number;
  snackOfTheWeek: (Snack & { weeklyVotes: number }) | null;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
