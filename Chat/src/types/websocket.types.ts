import type { Message, MessageStatus } from './chat.types';

export interface BackendMessagePayload {
  id: number | string;
  sender_id: number | string;
  receiver_id: number | string;
  content: string;
  created_at: string;
}

export interface BackendHistoryData {
  count: number;
  page: number;
  page_size: number;
  results: BackendMessagePayload[];
}

export type WSServerMessageType = 'connection' | 'message' | 'history' | 'presence' | 'error';

export interface WSConnectionEvent {
  type: 'connection';
  message: string;
  user_id?: number | string;
}

export interface WSMessageEvent {
  type: 'message';
  data: BackendMessagePayload;
}

export interface WSHistoryEvent {
  type: 'history';
  target_user_id?: number | string;
  data: BackendHistoryData;
}

export interface WSPresenceEvent {
  type: 'presence';
  user_id: number | string;
  status: 'online' | 'offline';
  last_seen?: string;
}

export interface WSErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type WSServerEvent =
  | WSConnectionEvent
  | WSMessageEvent
  | WSHistoryEvent
  | WSPresenceEvent
  | WSErrorEvent;


export interface WSClientSendMessage {
  type: 'message';
  receiver_id: number | string;
  content: string;
}

export interface WSClientFetchHistory {
  type: 'history';
  target_user_id: number | string;
  page?: number;
  page_size?: number;
}

export type WSClientAction = WSClientSendMessage | WSClientFetchHistory;

export type WSSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type WSEventType =
  | 'CONNECT'
  | 'DISCONNECT'
  | 'NEW_MESSAGE'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_READ'
  | 'USER_TYPING'
  | 'PRESENCE_CHANGE'
  | 'SOCKET_STATUS'
  | 'HISTORY_LOADED'
  | 'ERROR';

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
