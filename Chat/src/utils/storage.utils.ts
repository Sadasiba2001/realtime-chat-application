import { useAuthStore } from '../store/useAuthStore';

const THEME_KEY = 'chat_theme_mode';

export const storage = {
  getAuthToken: (): string | null => {
    const tokens = useAuthStore.getState().tokens;
    return tokens.access || localStorage.getItem('chat_auth_token');
  },
  getRefreshToken: (): string | null => {
    const tokens = useAuthStore.getState().tokens;
    return tokens.refresh || localStorage.getItem('chat_refresh_token');
  },
  setAuthTokens: (access: string, refresh: string): void => {
    useAuthStore.getState().setTokens({ access, refresh });
    localStorage.setItem('chat_auth_token', access);
    localStorage.setItem('chat_refresh_token', refresh);
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
