import { useAuthStore } from '../store/useAuthStore';

const THEME_KEY = 'chat_theme_mode';

export const storage = {
  getAuthToken: (): string | null => {
    return useAuthStore.getState().tokens.access;
  },
  getRefreshToken: (): string | null => {
    return useAuthStore.getState().tokens.refresh;
  },
  setAuthTokens: (access: string, refresh?: string | null): void => {
    useAuthStore.getState().setTokens({ access, refresh: refresh ?? null });
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
  getMessagesMap: <T = unknown>(): Record<string, T[]> => {
    try {
      const raw = localStorage.getItem('chat_messages_map_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
  setMessagesMap: <T = unknown>(map: Record<string, T[]>): void => {
    try {
      localStorage.setItem('chat_messages_map_v1', JSON.stringify(map));
    } catch (e) {
      console.error('Failed to save messages map to storage:', e);
    }
  },
  getDeletedForMe: (): string[] => {
    try {
      const raw = localStorage.getItem('chat_deleted_for_me');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  addDeletedForMe: (messageId: string): void => {
    try {
      const raw = localStorage.getItem('chat_deleted_for_me');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(messageId)) {
        list.push(messageId);
        localStorage.setItem('chat_deleted_for_me', JSON.stringify(list));
      }
    } catch (e) {
      console.error('Failed to save deleted for me:', e);
    }
  },
  getDeletedForEveryone: (): string[] => {
    try {
      const raw = localStorage.getItem('chat_deleted_for_everyone');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  addDeletedForEveryone: (messageId: string): void => {
    try {
      const raw = localStorage.getItem('chat_deleted_for_everyone');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(messageId)) {
        list.push(messageId);
        localStorage.setItem('chat_deleted_for_everyone', JSON.stringify(list));
      }
    } catch (e) {
      console.error('Failed to save deleted for everyone:', e);
    }
  },
};
