import type { User } from '../types/chat.types';
import { CURRENT_USER, MOCK_USERS } from '../mock/users';
import { apiClient, simulateNetworkDelay } from './api.client';
import { API_ENDPOINTS } from './api.endpoints';

class UserService {
  private users: User[] = [...MOCK_USERS];
  private currentUser: User = { ...CURRENT_USER };

  async getCurrentUser(): Promise<User> {
    return simulateNetworkDelay({ ...this.currentUser });
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.USERS);
      const resData = response.data;
      const results = resData?.data?.results || resData?.results || resData?.data || resData;
      if (Array.isArray(results) && results.length > 0) {
        return results.map((item: { id: string | number; name?: string; username?: string; avatar?: string; is_active?: boolean; status?: User['status']; last_seen?: string; about?: string; phone_number?: string; phone?: string; email?: string }) => ({
          id: String(item.id),
          name: item.name || item.username || 'User',
          username: item.username,
          avatar: item.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          status: item.status || 'offline',
          about: item.about || 'Available',
          phone: item.phone_number || item.phone || '',
          email: item.email || '',
          lastSeen: item.last_seen || undefined,
        }));
      }
      return simulateNetworkDelay([...this.users]);
    } catch {
      return simulateNetworkDelay([...this.users]);
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.SEARCH_USERS, {
        params: { q: query },
      });
      const resData = response.data;
      const results = resData?.data?.results || resData?.results || resData?.data || resData;
      if (Array.isArray(results)) {
        return results.map((item: { id: string | number; name?: string; username?: string; avatar?: string; is_active?: boolean; status?: User['status']; last_seen?: string; about?: string; phone_number?: string; phone?: string; email?: string }) => ({
          id: String(item.id),
          name: item.name || item.username || 'User',
          username: item.username,
          avatar: item.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          status: item.status || 'offline',
          about: item.about || 'Available',
          phone: item.phone_number || item.phone || '',
          email: item.email || '',
          lastSeen: item.last_seen || undefined,
        }));
      }

      return [];
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true') {
        const q = query.toLowerCase().trim();
        if (!q) return simulateNetworkDelay([...this.users]);
        const filtered = this.users.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            (u as { username?: string }).username?.toLowerCase().includes(q) ||
            u.phone.toLowerCase().includes(q) ||
            (u.email && u.email.toLowerCase().includes(q))
        );
        return simulateNetworkDelay(filtered);
      }
      throw err;
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    this.currentUser = { ...this.currentUser, ...updates };
    return simulateNetworkDelay({ ...this.currentUser });
  }
}

export const userService = new UserService();
