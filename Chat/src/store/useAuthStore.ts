import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserSession } from '../types/auth.types';

export interface AuthTokens {
  access: string | null;
  refresh: string | null;
}

interface AuthState {
  user: UserSession | null;
  tokens: AuthTokens;
  setAuth: (user: UserSession, tokens: { access: string; refresh: string }) => void;
  setTokens: (tokens: { access: string; refresh: string }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: {
        access: null,
        refresh: null,
      },
      setAuth: (user, tokens) => set({ user, tokens }),
      setTokens: (tokens) => set({ tokens }),
      clearAuth: () => set({ user: null, tokens: { access: null, refresh: null } }),
    }),
    {
      name: 'auth_store_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
