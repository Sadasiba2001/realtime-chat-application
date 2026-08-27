import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/auth.service';
import { apiClient } from '@/services/api.client';

vi.mock('@/services/api.client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('auth.service unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should format login payload and return user tokens', async () => {
    const mockResponse = {
      data: {
        access: 'mock_access_token',
        refresh: 'mock_refresh_token',
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
      },
    };
    (apiClient.post as any).mockResolvedValue(mockResponse);

    const result = await authService.login({ email: 'test@example.com', password: 'Password123!' });
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/login/', {
      email: 'test@example.com',
      password: 'Password123!',
    });
    expect(result.token).toBe('mock_access_token');
    expect(result.name).toBe('Test User');
  });

  it('should format register payload and return created user data', async () => {
    const mockResponse = {
      data: {
        access: 'mock_access_token',
        refresh: 'mock_refresh_token',
        user: {
          id: 2,
          email: 'reg@example.com',
          username: 'reguser',
          name: 'Reg User',
        },
      },
    };
    (apiClient.post as any).mockResolvedValue(mockResponse);

    const result = await authService.register({
      email: 'reg@example.com',
      username: 'reguser',
      password: 'Password123!',
      name: 'Reg User',
      phone_number: '1234567890',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/register/', {
      email: 'reg@example.com',
      username: 'reguser',
      password: 'Password123!',
      name: 'Reg User',
      phone_number: '1234567890',
    });
    expect(result.email).toBe('reg@example.com');
  });
});
