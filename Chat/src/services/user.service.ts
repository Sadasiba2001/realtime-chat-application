import type { User } from '../types/chat.types';
import { CURRENT_USER, MOCK_USERS } from '../mock/users';
import { simulateNetworkDelay } from './api.client';

class UserService {
  private users: User[] = [...MOCK_USERS];
  private currentUser: User = { ...CURRENT_USER };

  async getCurrentUser(): Promise<User> {
    return simulateNetworkDelay({ ...this.currentUser });
  }

  async getAllUsers(): Promise<User[]> {
    return simulateNetworkDelay([...this.users]);
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    this.currentUser = { ...this.currentUser, ...updates };
    return simulateNetworkDelay({ ...this.currentUser });
  }
}

export const userService = new UserService();
