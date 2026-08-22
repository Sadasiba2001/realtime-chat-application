import type { UserSession, LoginCredentials, RegisterPayload } from '../types/auth.types';
import { storage } from '../utils/storage.utils';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient, simulateNetworkDelay } from './api.client';
import { API_ENDPOINTS } from './api.endpoints';
import { CURRENT_USER } from '../mock/users';
import { userService } from './user.service';

const parseJwt = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

class AuthService {
  async login(credentials: LoginCredentials): Promise<UserSession> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const resData = response.data;
      const dataObj = resData?.data || resData;

      const access = dataObj?.access || dataObj?.token;
      const refresh = dataObj?.refresh || '';

      if (access) {
        storage.setAuthTokens(access, refresh);

        const jwtPayload = parseJwt(access);
        const user: UserSession = {
          id: String(dataObj?.user?.id || jwtPayload?.user_id || CURRENT_USER.id),
          name: String(dataObj?.user?.name || jwtPayload?.username || credentials.email.split('@')[0]),
          username: String(dataObj?.user?.username || jwtPayload?.username || ''),
          avatar: String(dataObj?.user?.avatar || CURRENT_USER.avatar),
          email: String(dataObj?.user?.email || jwtPayload?.email || credentials.email),
          phone: String(dataObj?.user?.phone || dataObj?.user?.phone_number || CURRENT_USER.phone),
          status: 'online',
          about: String(dataObj?.user?.about || CURRENT_USER.about),
          token: access,
        };

        useAuthStore.getState().setAuth(user, { access, refresh });
        return user;
      }
      throw new Error('Invalid login response structure: Missing access token');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      if (axiosErr.response) {
        throw err;
      }

      if (import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true') {
        console.warn('Backend server unreachable. Using fallback mock session.');
        const mockAccess = `mock_access_jwt_${Date.now()}`;
        const mockRefresh = `mock_refresh_jwt_${Date.now()}`;
        const mockSession: UserSession = {
          id: CURRENT_USER.id,
          name: CURRENT_USER.name,
          username: 'Barsha',
          avatar: CURRENT_USER.avatar,
          email: credentials.email,
          phone: CURRENT_USER.phone,
          status: 'online',
          about: CURRENT_USER.about,
          token: mockAccess,
        };
        storage.setAuthTokens(mockAccess, mockRefresh);
        useAuthStore.getState().setAuth(mockSession, { access: mockAccess, refresh: mockRefresh });
        return simulateNetworkDelay(mockSession);
      }
      throw err;
    }
  }

  async register(payload: RegisterPayload): Promise<UserSession> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: payload.name,
        username: payload.username,
        email: payload.email,
        phone_number: payload.phone_number,
        password: payload.password,
      });

      const resData = response.data;
      const dataObj = resData?.data || resData;

      const access = dataObj?.access || dataObj?.token || `token_${Date.now()}`;
      const refresh = dataObj?.refresh || `refresh_${Date.now()}`;

      storage.setAuthTokens(access, refresh);

      const jwtPayload = parseJwt(access);
      const user: UserSession = {
        id: String(dataObj?.user?.id || jwtPayload?.user_id || `user_${Date.now()}`),
        name: String(dataObj?.user?.name || payload.name),
        username: String(dataObj?.user?.username || payload.username),
        avatar: String(dataObj?.user?.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`),
        email: String(dataObj?.user?.email || payload.email),
        phone: String(dataObj?.user?.phone_number || payload.phone_number || '+91 98765 43210'),
        status: 'online',
        about: 'Available | Standard response time < 5 mins 🚀',
        token: access,
      };

      useAuthStore.getState().setAuth(user, { access, refresh });
      return user;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      if (axiosErr.response) {
        throw err;
      }

      if (import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true') {
        console.warn('Backend server unreachable. Using fallback mock session.');
        const mockAccess = `mock_access_jwt_${Date.now()}`;
        const mockRefresh = `mock_refresh_jwt_${Date.now()}`;
        const mockSession: UserSession = {
          id: `user_${Date.now()}`,
          name: payload.name,
          username: payload.username,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          email: payload.email,
          phone: payload.phone_number || '+91 98765 43210',
          status: 'online',
          about: 'Available | Standard response time < 5 mins 🚀',
          token: mockAccess,
        };
        storage.setAuthTokens(mockAccess, mockRefresh);
        useAuthStore.getState().setAuth(mockSession, { access: mockAccess, refresh: mockRefresh });
        return simulateNetworkDelay(mockSession);
      }
      throw err;
    }
  }

  async logout(): Promise<void> {
    const refreshToken = storage.getRefreshToken() || '';
    try {
      console.log('Posting Logout API to:', API_ENDPOINTS.AUTH.LOGOUT, 'Body:', { refresh: refreshToken });
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        refresh: refreshToken,
      });
    } catch (err) {
      console.warn('Logout API call finished with warning:', err);
    } finally {
      storage.removeAuthToken();
      useAuthStore.getState().clearAuth();
    }
    return simulateNetworkDelay(undefined);
  }

  async verifySession(): Promise<UserSession | null> {
    const token = storage.getAuthToken();
    const storedUser = useAuthStore.getState().user;
    if (!token) return null;

    if (storedUser) {
      return storedUser;
    }

    const mockSession: UserSession = {
      id: CURRENT_USER.id,
      name: CURRENT_USER.name,
      username: 'Barsha',
      avatar: CURRENT_USER.avatar,
      email: CURRENT_USER.email || 'barsha@example.com',
      phone: CURRENT_USER.phone,
      status: 'online',
      about: CURRENT_USER.about,
      token,
    };

    return simulateNetworkDelay(mockSession);
  }

  async searchUsers(query: string) {
    return userService.searchUsers(query);
  }
}

export const authService = new AuthService();
