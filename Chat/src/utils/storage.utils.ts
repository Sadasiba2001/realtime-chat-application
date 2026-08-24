import { useAuthStore } from '../store/useAuthStore';

const THEME_KEY = 'chat_theme_mode';

export const storage = {
  getAuthToken: (): string | null => {
    return useAuthStore.getState().tokens.access;
  },
  getRefreshToken: (): string | null => {
    return null;
  },
  setAuthTokens: (access: string, refresh: string): void => {
    useAuthStore.getState().setTokens({ access, refresh: null });
    localStorage.removeItem('chat_auth_token');
    localStorage.removeItem('chat_refresh_token');
  },
  removeAuthToken: (): void => {
    useAuthStore.getState().clearAuth();
    localStorage.removeItem('chat_auth_token');
    localStorage.removeItem('chat_refresh_token');
  },
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'dark';
  },
  setTheme: (theme: 'light' | 'dark'): void => {
    localStorage.setItem(THEME_KEY, theme);
  },
};
