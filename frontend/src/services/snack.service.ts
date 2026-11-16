import api from './api';
import type { Snack, Pagination, SnackSummary } from '../types';

export interface SnackFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SnackListResponse {
  snacks: Snack[];
  pagination: Pagination;
}

export const snackService = {
  getSnacks: async (filters: SnackFilters = {}): Promise<SnackListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.category) params.set('category', filters.category);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    const res = await api.get(`/snacks?${params.toString()}`);
    return res.data;
  },

  getSnackById: async (id: string): Promise<{ snack: Snack }> => {
    const res = await api.get(`/snacks/${id}`);
    return res.data;
  },

  getSummary: async (): Promise<{ summary: SnackSummary }> => {
    const res = await api.get('/snacks/summary');
    return res.data;
  },

  createSnack: async (data: {
    name: string;
    category: string;
    quantity: number;
    lowStockThreshold: number;
  }): Promise<{ snack: Snack }> => {
    const res = await api.post('/snacks', data);
    return res.data;
  },

  updateSnack: async (
    id: string,
    data: Partial<{
      name: string;
      category: string;
      quantity: number;
      lowStockThreshold: number;
    }>,
  ): Promise<{ snack: Snack }> => {
    const res = await api.patch(`/snacks/${id}`, data);
    return res.data;
  },

  deleteSnack: async (id: string): Promise<void> => {
    await api.delete(`/snacks/${id}`);
  },

  consumeSnack: async (id: string, amount: number): Promise<{ snack: Snack; message: string }> => {
    const res = await api.post(`/snacks/${id}/consume`, { amount });
    return res.data;
  },

  restockSnack: async (id: string, amount: number): Promise<{ snack: Snack; message: string }> => {
    const res = await api.post(`/snacks/${id}/restock`, { amount });
    return res.data;
  },

  vote: async (id: string): Promise<{ voteCount: number; hasVoted: boolean }> => {
    const res = await api.post(`/snacks/${id}/vote`);
    return res.data;
  },

  removeVote: async (id: string): Promise<{ voteCount: number; hasVoted: boolean }> => {
    const res = await api.delete(`/snacks/${id}/vote`);
    return res.data;
  },
};
