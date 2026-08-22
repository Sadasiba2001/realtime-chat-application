import axios from 'axios';
import { storage } from '../utils/storage.utils';
import { useAuthStore } from '../store/useAuthStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://footwork-vessel-guide.ngrok-free.dev/ws';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor for 401 token invalid / expiration handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.removeAuthToken();
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export const simulateNetworkDelay = <T>(data: T, delayMs = 150): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
};
