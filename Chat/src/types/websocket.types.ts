import type { Message, MessageStatus } from './chat.types';

export interface BackendMessagePayload {
  id: number | string;
  sender_id: number | string;
  receiver_id: number | string;
  content: string;
  status?: MessageStatus;
  created_at: string;
}

export interface BackendHistoryData {
  count: number;
  page: number;
  page_size: number;
  results: BackendMessagePayload[];
}

export type WSServerMessageType =
  | 'connection'
  | 'message'
  | 'history'
  | 'presence'
  | 'message_status'
  | 'error';

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

export interface WSMessageStatusEvent {
  type: 'message_status';
  message_id?: number | string;
  message_ids?: (number | string)[];
  status: 'sent' | 'delivered' | 'read';
  conversation_user_id?: number | string;
  receiver_id?: number | string;
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
  | WSMessageStatusEvent
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

export interface WSClientDeliveryReceipt {
  type: 'delivery_receipt';
  message_ids?: (number | string)[];
  message_id?: number | string;
}

export interface WSClientReadReceipt {
  type: 'read_receipt';
  conversation_user_id?: number | string;
  target_user_id?: number | string;
  message_ids?: (number | string)[];
}

export type WSClientAction =
  | WSClientSendMessage
  | WSClientFetchHistory
  | WSClientDeliveryReceipt
  | WSClientReadReceipt;

export type WSSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type WSEventType =
  | 'CONNECT'
  | 'DISCONNECT'
  | 'NEW_MESSAGE'
  | 'MESSAGE_STATUS_UPDATE'
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
