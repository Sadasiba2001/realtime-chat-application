import type { User } from '../types/chat.types';
import { apiClient } from './api.client';
import { API_ENDPOINTS } from './api.endpoints';

class UserService {
  private currentUser: User = {
    id: '',
    name: 'User',
    username: '',
    avatar: '',
    status: 'offline',
    about: 'Available',
    phone: '',
    email: '',
  };

  async getCurrentUser(): Promise<User> {
    return { ...this.currentUser };
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.USERS);
      const resData = response.data;
      const results = resData?.data?.results || resData?.results || resData?.data || resData;
      if (Array.isArray(results) && results.length > 0) {
        return results.map((item: { id: string | number; name?: string; username?: string; profile_image?: string; profile_image_url?: string; avatar?: string; is_active?: boolean; status?: User['status']; last_seen?: string; about?: string; phone_number?: string; phone?: string; email?: string }) => ({
          id: String(item.id),
          name: item.name || item.username || 'User',
          username: item.username,
          avatar: item.profile_image_url || item.profile_image || item.avatar || '',
          status: item.status || 'offline',
          about: item.about || 'Available',
          phone: item.phone_number || item.phone || '',
          email: item.email || '',
          lastSeen: item.last_seen || undefined,
        }));
      }
      return [];
    } catch {
      return [];
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
        return results.map((item: { id: string | number; name?: string; username?: string; profile_image?: string; profile_image_url?: string; avatar?: string; is_active?: boolean; status?: User['status']; last_seen?: string; about?: string; phone_number?: string; phone?: string; email?: string }) => ({
          id: String(item.id),
          name: item.name || item.username || 'User',
          username: item.username,
          avatar: item.profile_image_url || item.profile_image || item.avatar || '',
          status: item.status || 'offline',
          about: item.about || 'Available',
          phone: item.phone_number || item.phone || '',
          email: item.email || '',
          lastSeen: item.last_seen || undefined,
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    this.currentUser = { ...this.currentUser, ...updates };
    return { ...this.currentUser };
  }


  async uploadProfileImage(file: File): Promise<{ profile_image_url: string; profile_image_public_id?: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post(API_ENDPOINTS.AUTH.PROFILE_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data?.data || response.data;
    const newAvatarUrl = data?.profile_image_url || data?.profile_image || '';
    this.currentUser = {
      ...this.currentUser,
      avatar: newAvatarUrl,
    };
    return data;
  }

  async deleteProfileImage(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.AUTH.PROFILE_IMAGE);
    this.currentUser = {
      ...this.currentUser,
      avatar: '',
    };
  }
}

export const userService = new UserService();

