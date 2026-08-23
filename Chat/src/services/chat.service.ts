import type { Conversation, User } from '../types/chat.types';
import { MOCK_CONVERSATIONS } from '../mock/conversations';
import { apiClient, simulateNetworkDelay } from './api.client';
import { API_ENDPOINTS } from './api.endpoints';
import { getDirectConversationId } from '../utils/conversation.utils';
import { formatMessageTime } from '../utils/date.utils';

interface RawConversationPartner {
  id?: number | string;
  name?: string;
  username?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  avatar?: string;
  is_active?: boolean;
  about?: string;
}

interface RawConversationItem {
  user?: RawConversationPartner;
  user_id?: number | string;
  username?: string;
  name?: string;
  last_message?: {
    id: number | string;
    sender_id: number | string;
    receiver_id: number | string;
    content: string;
    created_at: string;
  } | null;
  last_message_at?: string | null;
  unread_count?: number;
}

class ChatService {
  private conversations: Conversation[] = [...MOCK_CONVERSATIONS];

  async getConversations(currentUser?: User): Promise<Conversation[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CHAT.CONVERSATIONS);
      const resData = response.data;
      const results = resData?.data || resData?.results || resData;

      if (Array.isArray(results)) {
        const myId = currentUser?.id || '0';
        const myUser: User = currentUser || {
          id: String(myId),
          name: 'Me',
          avatar: '',
          status: 'online',
          about: '',
          phone: '',
        };

        return results.map((item: RawConversationItem) => {
          const partnerUser: RawConversationPartner = item.user || {
            id: item.user_id,
            username: item.username,
            name: item.name || item.username,
          };
          const partnerId = String(partnerUser.id || '0');
          const convId = getDirectConversationId(myId, partnerId);


          const contactUser: User = {
            id: partnerId,
            name: partnerUser.name || partnerUser.username || `User ${partnerId}`,
            username: partnerUser.username,
            avatar: partnerUser.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            status: partnerUser.is_active !== false ? 'online' : 'offline',
            about: partnerUser.about || 'Available',
            phone: partnerUser.phone_number || partnerUser.phone || '',
            email: partnerUser.email || '',
          };

          const lastMsg = item.last_message
            ? {
                id: String(item.last_message.id),
                conversationId: convId,
                senderId: String(item.last_message.sender_id),
                text: item.last_message.content,
                timestamp: formatMessageTime(item.last_message.created_at),
                status: 'delivered' as const,
                createdAt: item.last_message.created_at,
              }
            : undefined;

          return {
            id: convId,
            type: 'direct' as const,
            participantIds: [String(myId), partnerId],
            participants: [myUser, contactUser],
            unreadCount: item.unread_count || 0,
            lastMessage: lastMsg,
            pinned: false,
            muted: false,
            createdAt: item.last_message?.created_at || item.last_message_at || new Date().toISOString(),
            updatedAt: item.last_message?.created_at || item.last_message_at || new Date().toISOString(),
          };
        });
      }
      return [];
    } catch (err) {
      if (import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true') {
        return simulateNetworkDelay([...this.conversations]);
      }
      throw err;
    }
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
