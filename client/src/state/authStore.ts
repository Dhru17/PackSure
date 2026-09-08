import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { api, setAuthToken } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  activeRole: UserRole | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('packsure_token'),
  isLoading: true,
  activeRole: null,

  login: async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setAuthToken(res.token);
    set({
      user: res.user,
      token: res.token,
      activeRole: res.user.role,
      isLoading: false
    });
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null, activeRole: null, isLoading: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('packsure_token');
    if (!token) {
      set({ user: null, token: null, activeRole: null, isLoading: false });
      return;
    }
    try {
      const res = await api.getMe();
      set({
        user: res.user,
        token,
        activeRole: res.user.role,
        isLoading: false
      });
    } catch {
      setAuthToken(null);
      set({ user: null, token: null, activeRole: null, isLoading: false });
    }
  }
}));
