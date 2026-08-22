import type { Message, MessageStatus } from './chat.types';

export type WSEventType =
  | 'CONNECT'
  | 'DISCONNECT'
  | 'NEW_MESSAGE'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_READ'
  | 'USER_TYPING'
  | 'PRESENCE_CHANGE';

export interface WSMessagePayload {
  conversationId: string;
  message: Message;
}

export interface WSReceiptPayload {
  conversationId: string;
  messageId: string;
  status: MessageStatus;
  userId: string;
}

export interface WSTypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface WSPresencePayload {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
}
