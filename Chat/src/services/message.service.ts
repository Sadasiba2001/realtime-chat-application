import type { Message, Attachment, ReplyPreview } from '../types/chat.types';
import { MOCK_MESSAGES } from '../mock/messages';
import { simulateNetworkDelay } from './api.client';

class MessageService {
  private messagesStore: Record<string, Message[]> = { ...MOCK_MESSAGES };

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    const list = this.messagesStore[conversationId] || [];
    return simulateNetworkDelay([...list]);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    attachments?: Attachment[],
    replyTo?: ReplyPreview
  ): Promise<Message> {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      conversationId,
      senderId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      attachments,
      replyTo,
      createdAt: new Date().toISOString(),
    };

    if (!this.messagesStore[conversationId]) {
      this.messagesStore[conversationId] = [];
    }

    this.messagesStore[conversationId].push(newMessage);
    return simulateNetworkDelay(newMessage);
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<boolean> {
    if (this.messagesStore[conversationId]) {
      this.messagesStore[conversationId] = this.messagesStore[conversationId].map((m) =>
        m.id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted' } : m
      );
    }
    return simulateNetworkDelay(true);
  }

  async toggleStarMessage(conversationId: string, messageId: string): Promise<boolean> {
    if (this.messagesStore[conversationId]) {
      this.messagesStore[conversationId] = this.messagesStore[conversationId].map((m) =>
        m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
      );
    }
    return simulateNetworkDelay(true);
  }

  async addReaction(
    conversationId: string,
    messageId: string,
    emoji: string,
    userId: string,
    userName: string
  ): Promise<Message | null> {
    if (this.messagesStore[conversationId]) {
      this.messagesStore[conversationId] = this.messagesStore[conversationId].map((m) => {
        if (m.id === messageId) {
          const reactions = m.reactions || [];
          const existingIndex = reactions.findIndex((r) => r.userId === userId);
          const updatedReactions = [...reactions];
          if (existingIndex > -1) {
            if (updatedReactions[existingIndex].emoji === emoji) {
              updatedReactions.splice(existingIndex, 1);
            } else {
              updatedReactions[existingIndex] = { emoji, userId, userName };
            }
          } else {
            updatedReactions.push({ emoji, userId, userName });
          }
          return { ...m, reactions: updatedReactions };
        }
        return m;
      });

      const updated = this.messagesStore[conversationId].find((m) => m.id === messageId);
      return simulateNetworkDelay(updated || null);
    }
    return simulateNetworkDelay(null);
  }
}

export const messageService = new MessageService();
