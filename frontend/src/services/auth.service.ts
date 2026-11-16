import api from './api';
import type { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ user: User }> => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  me: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};
