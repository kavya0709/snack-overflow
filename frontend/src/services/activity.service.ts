import api from './api';
import type { Activity, Pagination } from '../types';

export interface ActivityFilters {
  page?: number;
  limit?: number;
  snackId?: string;
  userId?: string;
  action?: string;
}

export interface ActivityListResponse {
  activities: Activity[];
  pagination: Pagination;
}

export const activityService = {
  getActivities: async (filters: ActivityFilters = {}): Promise<ActivityListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.snackId) params.set('snackId', filters.snackId);
    if (filters.userId) params.set('userId', filters.userId);
    if (filters.action) params.set('action', filters.action);

    const res = await api.get(`/activities?${params.toString()}`);
    return res.data;
  },
};
