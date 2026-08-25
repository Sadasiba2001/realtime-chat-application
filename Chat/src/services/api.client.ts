import axios from 'axios';
import { storage } from '../utils/storage.utils';
import { useAuthStore } from '../store/useAuthStore';

import { webSocketService } from './websocket.service';

export const API_BASE_URL = import.meta.env.VITE_REMOTE_BACKEND_URL || '';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://footwork-vessel-guide.ngrok-free.dev/ws';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
});

// Request interceptor to attach bearer auth token from Zustand store
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response interceptor for 401 token invalid / expiration handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/api/v1/auth/token/refresh/')) {
        storage.removeAuthToken();
        useAuthStore.getState().clearAuth();
        webSocketService.disconnect();
        const isPublicRoute =
          typeof window !== 'undefined' &&
          (window.location.pathname === '/' ||
            window.location.pathname === '/landing' ||
            window.location.pathname === '/auth');
        if (!isPublicRoute) {
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await apiClient.post('/api/v1/auth/token/refresh/');
        const dataObj = response.data?.data || response.data;
        const newAccess = dataObj?.access;
        if (!newAccess) {
          throw new Error('Refresh response missing access token');
        }

        useAuthStore.getState().setTokens({ access: newAccess, refresh: null });

        // Update Authorization header on original request
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        // Reconnect WebSocket with new access token
        webSocketService.connect(newAccess);

        processQueue(null, newAccess);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        storage.removeAuthToken();
        useAuthStore.getState().clearAuth();
        webSocketService.disconnect();
        const isPublicRoute =
          typeof window !== 'undefined' &&
          (window.location.pathname === '/' ||
            window.location.pathname === '/landing' ||
            window.location.pathname === '/auth');
        if (!isPublicRoute) {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const simulateNetworkDelay = <T>(data: T, delayMs = 150): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
};
