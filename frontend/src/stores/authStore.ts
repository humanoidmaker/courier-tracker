import { create } from 'zustand';
import api from '../lib/api';
import type { User } from '../lib/types';

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token: access_token, user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    set({ token, user });
  },
}));
