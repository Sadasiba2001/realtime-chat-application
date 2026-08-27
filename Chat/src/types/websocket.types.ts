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
  | 'message_deleted'
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

export interface WSProfileUpdateEvent {
  type: 'profile_update';
  user_id: number | string;
  profile_image_url?: string | null;
  profile_image?: string | null;
  avatar?: string | null;
}

export interface WSErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

import type { WSVoiceSignalingEvent } from './call.types';
import type {
  WSVideoCallOfferData,
  WSVideoCallAnswerData,
  WSVideoIceCandidateData,
  WSVideoCallRejectData,
  WSVideoCallCancelData,
  WSVideoCallEndData,
  WSVideoCallBusyData,
} from './video-call.types';

export interface WSVideoCallInitiatedEvent {
  type: 'video_call_initiated';
  call_id: string;
  receiver_id: number | string;
  status: string;
}

export interface WSVideoCallConnectedEvent {
  type: 'video_call_connected';
  call_id: string;
  status: string;
}

export type WSVideoSignalingEvent =
  | WSVideoCallOfferData
  | WSVideoCallAnswerData
  | WSVideoIceCandidateData
  | WSVideoCallRejectData
  | WSVideoCallCancelData
  | WSVideoCallEndData
  | WSVideoCallBusyData
  | WSVideoCallInitiatedEvent
  | WSVideoCallConnectedEvent;

export interface WSMessageDeleteEvent {
  type: 'message_deleted';
  message_id: number | string;
  delete_type: 'me' | 'everyone';
  sender_id?: number | string;
}

export type WSServerEvent =
  | WSConnectionEvent
  | WSMessageEvent
  | WSHistoryEvent
  | WSPresenceEvent
  | WSMessageStatusEvent
  | WSMessageDeleteEvent
  | WSProfileUpdateEvent
  | WSErrorEvent
  | WSVoiceSignalingEvent
  | WSVideoSignalingEvent;

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
  | WSClientReadReceipt
  | Record<string, unknown>;

export type WSSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type WSEventType =
  | 'CONNECT'
  | 'DISCONNECT'
  | 'NEW_MESSAGE'
  | 'MESSAGE_STATUS_UPDATE'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_READ'
  | 'MESSAGE_DELETED'
  | 'USER_TYPING'
  | 'PRESENCE_CHANGE'
  | 'PROFILE_UPDATE'
  | 'SOCKET_STATUS'
  | 'HISTORY_LOADED'
  | 'ERROR'
  | 'VOICE_CALL_OFFER'
  | 'VOICE_CALL_ANSWER'
  | 'VOICE_ICE_CANDIDATE'
  | 'VOICE_CALL_REJECT'
  | 'VOICE_CALL_CANCEL'
  | 'VOICE_CALL_END'
  | 'VOICE_CALL_BUSY'
  | 'VOICE_CALL_INITIATED'
  | 'VOICE_CALL_CONNECTED'
  | 'VIDEO_CALL_OFFER'
  | 'VIDEO_CALL_ANSWER'
  | 'VIDEO_ICE_CANDIDATE'
  | 'VIDEO_CALL_REJECT'
  | 'VIDEO_CALL_CANCEL'
  | 'VIDEO_CALL_END'
  | 'VIDEO_CALL_BUSY'
  | 'VIDEO_CALL_INITIATED'
  | 'VIDEO_CALL_CONNECTED';



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
