import type { Conversation, User } from '../types/chat.types';
import { MOCK_CONVERSATIONS } from '../mock/conversations';
import { simulateNetworkDelay } from './api.client';
import { getDirectConversationId } from '../utils/conversation.utils';

class ChatService {
  private conversations: Conversation[] = [...MOCK_CONVERSATIONS];

  async getConversations(): Promise<Conversation[]> {
    return simulateNetworkDelay([...this.conversations]);
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const conv = this.conversations.find((c) => c.id === id);
    return simulateNetworkDelay(conv ? { ...conv } : undefined);
  }

  async createDirectConversation(me: User, contact: User): Promise<Conversation> {
    const convId = getDirectConversationId(me.id, contact.id);
    const existing = this.conversations.find((c) => c.id === convId);

    if (existing) {
      return simulateNetworkDelay(existing);
    }

    const newConv: Conversation = {
      id: convId,
      type: 'direct',
      participantIds: [String(me.id), String(contact.id)],
      participants: [me, contact],
      unreadCount: 0,
      pinned: false,
      muted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.unshift(newConv);
    return simulateNetworkDelay(newConv);
  }

  async createGroupConversation(me: User, groupName: string, members: User[]): Promise<Conversation> {
    const allParticipants = [me, ...members];
    const newConv: Conversation = {
      id: `conv_group_${Date.now()}`,
      type: 'group',
      name: groupName,
      participantIds: allParticipants.map((p) => String(p.id)),
      participants: allParticipants,
      unreadCount: 0,
      pinned: false,
      muted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groupAvatar: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80`,
    };

    this.conversations.unshift(newConv);
    return simulateNetworkDelay(newConv);
  }

  async togglePinConversation(id: string): Promise<boolean> {
    this.conversations = this.conversations.map((c) =>
      c.id === id ? { ...c, pinned: !c.pinned } : c
    );
    return simulateNetworkDelay(true);
  }

  async toggleMuteConversation(id: string): Promise<boolean> {
    this.conversations = this.conversations.map((c) =>
      c.id === id ? { ...c, muted: !c.muted } : c
    );
    return simulateNetworkDelay(true);
  }

  async markAsRead(id: string): Promise<void> {
    this.conversations = this.conversations.map((c) =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    );
    return simulateNetworkDelay(undefined);
  }
}

export const chatService = new ChatService();
