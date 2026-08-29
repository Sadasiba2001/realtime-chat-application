import type { Conversation, User, UserPresence, MessageStatus } from '../types/chat.types';
import { apiClient, simulateNetworkDelay } from './api.client';
import { API_ENDPOINTS } from './api.endpoints';
import { getDirectConversationId } from '../utils/conversation.utils';
import { formatMessageTime } from '../utils/date.utils';

interface RawConversationPartner {

  id?: number | string;
  name?: string;
  username?: string;
  avatar?: string;
  profile_image?: string;
  profile_image_url?: string;
  phone_number?: string;
  phone?: string;
  email?: string;
  status?: UserPresence;
  last_seen?: string;
  lastSeen?: string;
  about?: string;
}

interface RawConversationItem {
  user?: RawConversationPartner;
  user_id?: number | string;
  username?: string;
  name?: string;
  avatar?: string;
  profile_image?: string;
  profile_image_url?: string;
  status?: UserPresence;
  last_seen?: string;
  last_message?: {
    id: number | string;
    sender_id: number | string;
    receiver_id: number | string;
    content: string;
    status?: string;
    created_at: string;
  } | null;
  last_message_at?: string | null;
  unread_count?: number;
}


class ChatService {
  private conversations: Conversation[] = [];

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
          username: '',
          avatar: '',
          status: 'online',
          about: 'Available',
          phone: '',
          email: '',
        };

        return results.map((item: RawConversationItem) => {
          const partnerUser = item.user || {};
          const partnerId = String(partnerUser.id || item.user_id || '0');
          const convId = getDirectConversationId(myId, partnerId);


          const contactUser: User = {
            id: partnerId,
            name: partnerUser.name || partnerUser.username || item.name || item.username || `User ${partnerId}`,
            username: partnerUser.username || item.username,
            avatar: partnerUser.profile_image_url || partnerUser.profile_image || partnerUser.avatar || item.profile_image_url || item.profile_image || item.avatar || '',
            status: partnerUser.status || item.status || 'offline',
            about: partnerUser.about || 'Available',
            phone: partnerUser.phone_number || partnerUser.phone || '',
            email: partnerUser.email || '',
            lastSeen: partnerUser.last_seen || partnerUser.lastSeen || item.last_seen || undefined,
          };



          const lastMsg = item.last_message
            ? {
                id: String(item.last_message.id),
                conversationId: convId,
                senderId: String(item.last_message.sender_id),
                text: item.last_message.content,
                timestamp: formatMessageTime(item.last_message.created_at),
                status: (item.last_message.status as MessageStatus) || 'sent',
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
            pinned: Boolean(item.is_pinned || item.pinned),
            archived: Boolean(item.is_archived || item.archived),
            muted: Boolean(item.is_muted || item.muted),
            isBlocked: Boolean(item.is_blocked || item.user?.is_blocked),
            isBlockedByThem: Boolean(item.is_blocked_by_them || item.user?.is_blocked_by_them),
            createdAt: item.last_message?.created_at || item.last_message_at || new Date().toISOString(),
            updatedAt: item.last_message?.created_at || item.last_message_at || new Date().toISOString(),
          };
        });
      }
      return [];
    } catch {
      return [];
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
      groupAvatar: '',
    };

    this.conversations.unshift(newConv);
    return simulateNetworkDelay(newConv);
  }

  async togglePinConversation(id: string): Promise<boolean> {
    const numericId = parseInt(id, 10);
    let newPinnedState = false;
    this.conversations = this.conversations.map((c) => {
      if (c.id === id) {
        newPinnedState = !c.pinned;
        return { ...c, pinned: newPinnedState };
      }
      return c;
    });

    if (!isNaN(numericId)) {
      try {
        await apiClient.post(`/api/v1/chat/conversations/${numericId}/pin/`);
      } catch (err) {
        console.error('[ChatService] Failed to persist pin status on backend:', err);
      }
    }
    return newPinnedState;
  }

  async toggleArchiveConversation(id: string): Promise<boolean> {
    const numericId = parseInt(id, 10);
    let newArchivedState = false;
    this.conversations = this.conversations.map((c) => {
      if (c.id === id) {
        newArchivedState = !c.archived;
        return { ...c, archived: newArchivedState };
      }
      return c;
    });

    if (!isNaN(numericId)) {
      try {
        await apiClient.post(`/api/v1/chat/conversations/${numericId}/archive/`);
      } catch (err) {
        console.error('[ChatService] Failed to persist archive status on backend:', err);
      }
    }
    return newArchivedState;
  }

  async toggleMuteConversation(id: string, duration: string = 'always'): Promise<boolean> {
    const numericId = parseInt(id, 10);
    let newMutedState = false;
    this.conversations = this.conversations.map((c) => {
      if (c.id === id) {
        newMutedState = !c.muted;
        return { ...c, muted: newMutedState };
      }
      return c;
    });

    if (!isNaN(numericId)) {
      try {
        if (newMutedState) {
          await apiClient.post(`/api/v1/chat/conversations/${numericId}/mute/`, { duration });
        } else {
          await apiClient.delete(`/api/v1/chat/conversations/${numericId}/unmute/`);
        }
      } catch (err) {
        console.error('[ChatService] Failed to persist mute status on backend:', err);
      }
    }
    return newMutedState;
  }

  async blockUser(targetUserId: string): Promise<boolean> {
    const numericId = parseInt(targetUserId, 10);
    this.conversations = this.conversations.map((c) => {
      if (c.id === targetUserId || c.participantIds.includes(targetUserId)) {
        return { ...c, isBlocked: true };
      }
      return c;
    });

    if (!isNaN(numericId)) {
      try {
        await apiClient.post(`/api/v1/chat/users/${numericId}/block/`);
      } catch (err) {
        console.error('[ChatService] Failed to persist block status on backend:', err);
      }
    }
    return true;
  }

  async unblockUser(targetUserId: string): Promise<boolean> {
    const numericId = parseInt(targetUserId, 10);
    this.conversations = this.conversations.map((c) => {
      if (c.id === targetUserId || c.participantIds.includes(targetUserId)) {
        return { ...c, isBlocked: false };
      }
      return c;
    });

    if (!isNaN(numericId)) {
      try {
        await apiClient.delete(`/api/v1/chat/users/${numericId}/unblock/`);
      } catch (err) {
        console.error('[ChatService] Failed to persist unblock status on backend:', err);
      }
    }
    return true;
  }

  async reportUser(targetUserId: string, reason: string, description: string = ''): Promise<boolean> {
    const numericId = parseInt(targetUserId, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid user ID.');
    }
    await apiClient.post(`/api/v1/chat/users/${numericId}/report/`, {
      reason,
      description,
    });
    return true;
  }

  async reportMessage(messageId: string, reason: string, description: string = ''): Promise<boolean> {
    const numericId = parseInt(messageId, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid message ID.');
    }
    await apiClient.post(`/api/v1/chat/messages/${numericId}/report/`, {
      reason,
      description,
    });
    return true;
  }

  async markAsRead(id: string): Promise<void> {
    this.conversations = this.conversations.map((c) =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    );
    return simulateNetworkDelay(undefined);
  }

  async searchMessages(query: string, page: number = 1, pageSize: number = 20) {
    if (!query.trim()) return { count: 0, results: [] };
    try {
      const response = await apiClient.get(
        `/api/v1/chat/messages/search/?q=${encodeURIComponent(query.trim())}&page=${page}&page_size=${pageSize}`
      );
      return response.data?.data || { count: 0, results: [] };
    } catch (err) {
      console.error('[ChatService] Error searching messages:', err);
      return { count: 0, results: [] };
    }
  }
}

export const chatService = new ChatService();
