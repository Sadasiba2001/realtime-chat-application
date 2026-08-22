/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserSession, LoginCredentials, RegisterPayload } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { webSocketService } from '../services/websocket.service';
import { useAuthStore } from '../store/useAuthStore';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseErrorMessage = (err: unknown, fallbackMessage: string): string => {
  if (!err || typeof err !== 'object') return fallbackMessage;

  const axiosErr = err as { response?: { data?: unknown; status?: number } };
  const responseData = axiosErr.response?.data;

  if (!responseData) {
    if (err instanceof Error && err.message) return err.message;
    return fallbackMessage;
  }

  if (typeof responseData === 'string') return responseData;

  if (typeof responseData === 'object' && responseData !== null) {
    const dataObj = responseData as Record<string, unknown>;

    if (typeof dataObj.message === 'string') return dataObj.message;
    if (typeof dataObj.detail === 'string') return dataObj.detail;
    if (typeof dataObj.error === 'string') return dataObj.error;

    if (Array.isArray(dataObj.non_field_errors) && dataObj.non_field_errors.length > 0) {
      return dataObj.non_field_errors.join(', ');
    }

    const fieldErrors: string[] = [];
    for (const [key, value] of Object.entries(dataObj)) {
      const valText = Array.isArray(value) ? value.join(', ') : String(value);
      fieldErrors.push(`${key}: ${valText}`);
    }

    if (fieldErrors.length > 0) {
      return fieldErrors.join(' | ');
    }
  }

  return fallbackMessage;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storeUser = useAuthStore((state) => state.user);
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeUser = storeUser || sessionUser;

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await authService.verifySession();
        if (session) {
          setSessionUser(session);
          webSocketService.connect(session.token);
        }
      } catch (err: unknown) {
        console.error('Session verification failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authService.login(credentials);
      setSessionUser(session);
      webSocketService.connect(session.token);
    } catch (err: unknown) {
      const parsedError = parseErrorMessage(err, 'Invalid email or password');
      setError(parsedError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authService.register(payload);
      setSessionUser(session);
      webSocketService.connect(session.token);
    } catch (err: unknown) {
      const parsedError = parseErrorMessage(err, 'Registration failed. Please check your credentials.');
      setError(parsedError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      webSocketService.disconnect();
      setSessionUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        isAuthenticated: !!activeUser,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
