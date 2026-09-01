import type { UserSession, LoginCredentials, RegisterPayload } from '../types/auth.types';
import { storage } from '../utils/storage.utils';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient, simulateNetworkDelay } from './api.client';
import { API_ENDPOINTS } from './api.endpoints';
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
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const resData = response.data;
    const dataObj = resData?.data || resData;

    const access = dataObj?.access || resData?.access || dataObj?.token;
    const refresh = dataObj?.refresh || resData?.refresh || '';

    if (access) {
      storage.setAuthTokens(access, refresh);

      const jwtPayload = parseJwt(access);
      const user: UserSession = {
        id: String(dataObj?.user?.id || jwtPayload?.user_id || '0'),
        name: String(dataObj?.user?.name || jwtPayload?.username || credentials.email.split('@')[0]),
        username: String(dataObj?.user?.username || jwtPayload?.username || ''),
        avatar: String(dataObj?.user?.profile_image_url || dataObj?.user?.profile_image || dataObj?.user?.avatar || ''),
        email: String(dataObj?.user?.email || jwtPayload?.email || credentials.email),
        phone: String(dataObj?.user?.phone || dataObj?.user?.phone_number || ''),
        status: 'online',
        about: String(dataObj?.user?.about || 'Available'),
        token: access,
      };

      useAuthStore.getState().setAuth(user, { access, refresh });
      return user;
    }
    throw new Error('Invalid login response structure: Missing access token');
  }

  async register(payload: RegisterPayload): Promise<UserSession> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
      name: payload.name,
      username: payload.username,
      email: payload.email,
      phone_number: payload.phone_number,
      password: payload.password,
    });

    const resData = response.data;
    const dataObj = resData?.data || resData;

    const access = dataObj?.access || resData?.access || dataObj?.token;
    const refresh = dataObj?.refresh || resData?.refresh || '';

    if (!access) {
      throw new Error('Registration failed: missing access token in response');
    }

    storage.setAuthTokens(access, refresh);

    const jwtPayload = parseJwt(access);
    const user: UserSession = {
      id: String(dataObj?.user?.id || jwtPayload?.user_id || '0'),
      name: String(dataObj?.user?.name || payload.name),
      username: String(dataObj?.user?.username || payload.username),
      avatar: String(dataObj?.user?.profile_image_url || dataObj?.user?.profile_image || dataObj?.user?.avatar || ''),
      email: String(dataObj?.user?.email || payload.email),
      phone: String(dataObj?.user?.phone_number || payload.phone_number || ''),
      status: 'online',
      about: 'Available',
      token: access,
    };

    useAuthStore.getState().setAuth(user, { access, refresh });
    return user;
  }


  async logout(): Promise<void> {
    const refreshToken = storage.getRefreshToken() || useAuthStore.getState().tokens.refresh || '';

    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        refresh: refreshToken,
      });

      if (response.data && response.data.status === false) {
        throw new Error('Something went wrong, try it later.');
      }
    } catch {
      throw new Error('Something went wrong, try it later.');
    }

    storage.removeAuthToken();
    useAuthStore.getState().clearAuth();
    return simulateNetworkDelay(undefined);
  }

  async verifySession(): Promise<UserSession | null> {
    const token = storage.getAuthToken();
    const storedUser = useAuthStore.getState().user;
    if (token && storedUser) {
      return storedUser;
    }

    const refreshToken = storage.getRefreshToken() || useAuthStore.getState().tokens.refresh;
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await apiClient.post('/api/v1/auth/token/refresh/', { refresh: refreshToken });
      const dataObj = response.data?.data || response.data;
      const access = dataObj?.access;
      const newRefresh = dataObj?.refresh || refreshToken;
      if (access) {
        const jwtPayload = parseJwt(access);
        const user: UserSession = {
          id: String(jwtPayload?.user_id || '0'),
          name: String(jwtPayload?.name || jwtPayload?.username || `User ${jwtPayload?.user_id}`),
          username: String(jwtPayload?.username || ''),
          avatar: '',
          email: String(jwtPayload?.email || ''),
          phone: '',
          status: 'online',
          about: 'Available',
          token: access,
        };
        useAuthStore.getState().setAuth(user, { access, refresh: newRefresh });
        return user;
      }
    } catch (err) {
      console.warn('Session restoration failed:', err);
    }

    return null;
  }


  async searchUsers(query: string) {
    return userService.searchUsers(query);
  }
}

export const authService = new AuthService();
