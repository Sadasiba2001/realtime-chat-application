import type {
  WSEventType,
  WSServerEvent,
  WSSocketStatus,
} from '../types/websocket.types';

type EventCallback<T = unknown> = (data: T) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback<any>>> = new Map();
  private currentToken: string | null = null;
  private socketStatus: WSSocketStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalDisconnect = false;

  private resolveWebSocketUrl(): string {
    let rawWsUrl = (import.meta.env.VITE_WS_URL || '').trim();
    const rawBackendUrl = (import.meta.env.VITE_REMOTE_BACKEND_URL || '').trim();

    let baseUrl = '';

    if (rawWsUrl) {
      if ((rawWsUrl.includes('localhost') || rawWsUrl.includes('127.0.0.1')) && rawWsUrl.startsWith('wss://')) {
        rawWsUrl = rawWsUrl.replace('wss://', 'ws://');
      }
      baseUrl = rawWsUrl.replace(/\/+$/, '');
      if (!baseUrl.endsWith('/ws')) {
        baseUrl = `${baseUrl}/ws`;
      }
    } else if (rawBackendUrl) {
      const isHttps = rawBackendUrl.startsWith('https');
      const wsProtocol = isHttps ? 'wss' : 'ws';
      const host = rawBackendUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
      baseUrl = `${wsProtocol}://${host}/ws`;
    }

    if (!baseUrl) {
      if (typeof window !== 'undefined') {
        const isHttps = window.location.protocol === 'https:';
        const wsProtocol = isHttps ? 'wss' : 'ws';
        const hostname = window.location.hostname || 'localhost';
        const port = (window.location.port === '5173' || window.location.port === '3000') ? '8000' : (window.location.port || '8000');
        baseUrl = `${wsProtocol}://${hostname}:${port}/ws`;
      } else {
        baseUrl = 'ws://localhost:8000/ws';
      }
    }

    return `${baseUrl}/chat/`;
  }

  public connect(token: string): void {
    if (!token) {
      console.warn('[WebSocket] Cannot connect: auth token missing.');
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.currentToken === token) {
      return;
    }

    this.intentionalDisconnect = false;
    this.cleanupSocket();
    this.currentToken = token;
    this.setStatus('connecting');

    const wsUrl = this.resolveWebSocketUrl();
    console.log(`[WebSocket] Connecting to user-level socket... (${wsUrl})`);

    try {
      this.socket = new WebSocket(wsUrl, ['access_token', token]);

      this.socket.onopen = () => {
        console.log('[WebSocket] User-level WebSocket connected successfully.');
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.emit('CONNECT', { status: 'connected', timestamp: new Date().toISOString() });
        this.flushPendingQueue();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as WSServerEvent;
          this.handleServerMessage(payload);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message JSON:', event.data, err);
        }
      };

      this.socket.onerror = (event) => {
        console.warn('[WebSocket] Socket error:', event);
        this.setStatus('error');
        this.emit('ERROR', { code: 'SOCKET_ERROR', message: 'WebSocket encountered an error.' });
      };

      this.socket.onclose = (event: CloseEvent) => {
        console.log(`[WebSocket] Socket closed (code: ${event.code}, reason: ${event.reason || 'None'})`);
        this.cleanupSocket();
        this.setStatus('disconnected');
        this.emit('DISCONNECT', { code: event.code, reason: event.reason });

        // Auto-reconnect on unexpected disconnect (not auth 4001, duplicate 4002, conn limit 4003, or target error 4004)
        if (
          !this.intentionalDisconnect &&
          event.code !== 4001 &&
          event.code !== 4002 &&
          event.code !== 4003 &&
          event.code !== 4004 &&
          this.reconnectAttempts < this.maxReconnectAttempts &&
          this.currentToken
        ) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
          this.reconnectAttempts += 1;
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          this.reconnectTimer = setTimeout(() => {
            if (this.currentToken && !this.intentionalDisconnect) {
              this.connect(this.currentToken);
            }
          }, delay);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Connection creation failed:', err);
      this.setStatus('error');
    }
  }

  private handleServerMessage(event: WSServerEvent): void {
    switch (event.type) {
      case 'connection':
        console.log('[WebSocket] Server connection acknowledged:', event.message);
        this.setStatus('connected');
        break;

      case 'message':
        this.emit('NEW_MESSAGE', event.data);
        break;

      case 'history':
        this.emit('HISTORY_LOADED', event);
        break;

      case 'presence':
        this.emit('PRESENCE_CHANGE', event);
        break;

      case 'message_status':
        this.emit('MESSAGE_STATUS_UPDATE', event);
        break;

      case 'message_deleted':
        this.emit('MESSAGE_DELETED', event);
        break;

      case 'message_edited':
        this.emit('MESSAGE_EDITED', event);
        break;

      case 'message_reaction_updated':
        this.emit('MESSAGE_REACTION_UPDATED', event);
        break;

      case 'typing_status':
        this.emit('USER_TYPING', event);
        break;

      case 'profile_update':
        this.emit('PROFILE_UPDATE', event);
        break;

      case 'call_offer':
        this.emit('VOICE_CALL_OFFER', event);
        break;

      case 'call_answer':
        this.emit('VOICE_CALL_ANSWER', event);
        break;

      case 'ice_candidate':
        this.emit('VOICE_ICE_CANDIDATE', event);
        break;

      case 'call_reject':
        this.emit('VOICE_CALL_REJECT', event);
        break;

      case 'call_cancel':
        this.emit('VOICE_CALL_CANCEL', event);
        break;

      case 'call_end':
        this.emit('VOICE_CALL_END', event);
        break;

      case 'call_busy':
        this.emit('VOICE_CALL_BUSY', event);
        break;

      case 'call_initiated':
        this.emit('VOICE_CALL_INITIATED', event);
        break;

      case 'call_connected':
        this.emit('VOICE_CALL_CONNECTED', event);
        break;

      case 'video_call_offer':
        this.emit('VIDEO_CALL_OFFER', event);
        break;

      case 'video_call_answer':
        this.emit('VIDEO_CALL_ANSWER', event);
        break;

      case 'video_ice_candidate':
        this.emit('VIDEO_ICE_CANDIDATE', event);
        break;

      case 'video_call_reject':
        this.emit('VIDEO_CALL_REJECT', event);
        break;

      case 'video_call_cancel':
        this.emit('VIDEO_CALL_CANCEL', event);
        break;

      case 'video_call_end':
        this.emit('VIDEO_CALL_END', event);
        break;

      case 'video_call_busy':
        this.emit('VIDEO_CALL_BUSY', event);
        break;

      case 'video_call_initiated':
        this.emit('VIDEO_CALL_INITIATED', event);
        break;

      case 'video_call_connected':
        this.emit('VIDEO_CALL_CONNECTED', event);
        break;

      case 'error':
        console.error('[WebSocket] Server error:', event);
        this.emit('ERROR', event);
        break;

      default:
        console.warn('[WebSocket] Unknown event type:', event);
    }
  }

  public sendSignaling(payload: Record<string, unknown>): boolean {
    if (!payload || !payload.type) return false;
    const payloadStr = JSON.stringify(payload);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      this.pendingQueue.push(payloadStr);
      return true;
    }

    console.warn('[WebSocket] Cannot send signaling: Socket is not open.');
    return false;
  }

  private pendingQueue: string[] = [];

  private flushPendingQueue(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.pendingQueue.length > 0) {
      console.log(`[WebSocket] Flushing ${this.pendingQueue.length} pending queued messages...`);
      while (this.pendingQueue.length > 0) {
        const payloadStr = this.pendingQueue.shift();
        if (payloadStr) {
          this.socket.send(payloadStr);
        }
      }
    }
  }

  public sendMessage(receiverId: string | number, content: string, replyToId?: string | number, attachmentIds?: (number | string)[]): boolean {
    const trimmed = content.trim();
    if ((!trimmed && (!attachmentIds || attachmentIds.length === 0)) || !receiverId) return false;

    // Clean numeric ID if string like "user_2"
    const numMatch = String(receiverId).match(/\d+/);
    const cleanReceiverId = numMatch ? parseInt(numMatch[0], 10) : receiverId;

    let cleanReplyToId: number | string | undefined = undefined;
    if (replyToId !== undefined && replyToId !== null) {
      const rMatch = String(replyToId).match(/\d+/);
      cleanReplyToId = rMatch ? parseInt(rMatch[0], 10) : replyToId;
    }

    const payloadStr = JSON.stringify({
      type: 'message',
      receiver_id: cleanReceiverId,
      content: trimmed || '🎤 Voice Message',
      ...(cleanReplyToId !== undefined ? { reply_to_id: cleanReplyToId, reply_to: cleanReplyToId } : {}),
      ...(attachmentIds && attachmentIds.length > 0 ? { attachment_ids: attachmentIds } : {}),
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (!this.socket || this.socket.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Socket connecting or initializing: Queuing message for transmission upon connect.');
      this.pendingQueue.push(payloadStr);
      return true;
    }

    console.warn('[WebSocket] Cannot send message: Socket is not open.');
    return false;
  }

  public sendForward(messageId: string | number, targetUserIds: (string | number)[] | string | number): boolean {
    if (!messageId || !targetUserIds) return false;

    const mMatch = String(messageId).match(/\d+/);
    const cleanMessageId = mMatch ? parseInt(mMatch[0], 10) : messageId;

    let cleanTargets: number[] = [];
    if (Array.isArray(targetUserIds)) {
      cleanTargets = targetUserIds.map((t) => {
        const match = String(t).match(/\d+/);
        return match ? parseInt(match[0], 10) : Number(t);
      }).filter((n) => !isNaN(n));
    } else {
      const match = String(targetUserIds).match(/\d+/);
      if (match) cleanTargets.push(parseInt(match[0], 10));
    }

    if (cleanTargets.length === 0) return false;

    const payloadStr = JSON.stringify({
      type: 'forward_message',
      message_id: cleanMessageId,
      target_user_ids: cleanTargets,
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (!this.socket || this.socket.readyState === WebSocket.CONNECTING) {
      this.pendingQueue.push(payloadStr);
      return true;
    }

    return false;
  }

  public editMessage(messageId: string | number, content: string): boolean {
    const trimmed = content.trim();
    if (!trimmed || !messageId) return false;

    const numMatch = String(messageId).match(/\d+/);
    const cleanMessageId = numMatch ? parseInt(numMatch[0], 10) : messageId;

    const payloadStr = JSON.stringify({
      type: 'edit_message',
      message_id: cleanMessageId,
      content: trimmed,
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (!this.socket || this.socket.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Socket connecting: Queuing edit_message for transmission upon connect.');
      this.pendingQueue.push(payloadStr);
      return true;
    }

    console.warn('[WebSocket] Cannot edit message: Socket is not open.');
    return false;
  }

  public fetchHistory(targetUserId: string | number, page: number = 1, pageSize: number = 50): boolean {
    if (!targetUserId) return false;

    const numMatch = String(targetUserId).match(/\d+/);
    const cleanTargetId = numMatch ? parseInt(numMatch[0], 10) : targetUserId;

    const payloadStr = JSON.stringify({
      type: 'history',
      target_user_id: cleanTargetId,
      page,
      page_size: pageSize,
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (!this.socket || this.socket.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Socket connecting or initializing: Queuing history request for transmission upon connect.');
      this.pendingQueue.push(payloadStr);
      return true;
    }

    console.warn('[WebSocket] Cannot fetch history: Socket is not open.');
    return false;
  }

  public sendDeliveryReceipt(messageIds: (string | number)[] | (string | number)): boolean {
    const list = Array.isArray(messageIds) ? messageIds : [messageIds];
    const validNumericIds = list
      .map((id) => {
        const match = String(id).match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      })
      .filter((id): id is number => id !== null);

    if (validNumericIds.length === 0) return false;

    const payloadStr = JSON.stringify({
      type: 'delivery_receipt',
      message_ids: validNumericIds,
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      this.pendingQueue.push(payloadStr);
      return true;
    }

    return false;
  }

  public sendReadReceipt(
    conversationUserId: string | number,
    messageIds?: (string | number)[]
  ): boolean {
    const numMatch = String(conversationUserId).match(/\d+/);
    const cleanUserId = numMatch ? parseInt(numMatch[0], 10) : conversationUserId;
    if (!cleanUserId) return false;

    let validNumericIds: number[] | undefined = undefined;
    if (messageIds && messageIds.length > 0) {
      validNumericIds = messageIds
        .map((id) => {
          const match = String(id).match(/\d+/);
          return match ? parseInt(match[0], 10) : null;
        })
        .filter((id): id is number => id !== null);
    }

    const payloadStr = JSON.stringify({
      type: 'read_receipt',
      conversation_user_id: cleanUserId,
      ...(validNumericIds && validNumericIds.length > 0 ? { message_ids: validNumericIds } : {}),
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      this.pendingQueue.push(payloadStr);
      return true;
    }

    return false;
  }

  public sendTyping(targetUserId: string | number, isTyping: boolean): boolean {
    const numMatch = String(targetUserId).match(/\d+/);
    const cleanUserId = numMatch ? parseInt(numMatch[0], 10) : targetUserId;
    if (!cleanUserId) return false;

    const payloadStr = JSON.stringify({
      type: isTyping ? 'typing_start' : 'typing_stop',
      target_user_id: cleanUserId,
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    return false;
  }

  public sendDeleteMessage(
    targetUserId: string | number,
    messageId: string | number,
    deleteType: 'me' | 'everyone' = 'everyone'
  ): boolean {
    const numTarget = String(targetUserId).match(/\d+/);
    const cleanTargetId = numTarget ? parseInt(numTarget[0], 10) : targetUserId;

    const numMsg = String(messageId).match(/\d+/);
    const cleanMsgId = numMsg ? parseInt(numMsg[0], 10) : messageId;

    const payloadStr = JSON.stringify({
      type: 'delete_message',
      target_user_id: cleanTargetId,
      message_id: cleanMsgId,
      delete_type: deleteType,
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (!this.socket || this.socket.readyState === WebSocket.CONNECTING) {
      this.pendingQueue.push(payloadStr);
      return true;
    }

    return false;
  }

  public sendReaction(messageId: string | number, emoji: string): boolean {
    const numMsg = String(messageId).match(/\d+/);
    const cleanMsgId = numMsg ? parseInt(numMsg[0], 10) : messageId;

    const payloadStr = JSON.stringify({
      type: 'add_reaction',
      message_id: cleanMsgId,
      emoji,
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (!this.socket || this.socket.readyState === WebSocket.CONNECTING) {
      this.pendingQueue.push(payloadStr);
      return true;
    }

    console.warn('[WebSocket] Cannot send reaction: Socket is not open.');
    return false;
  }


  public disconnect(): void {
    this.intentionalDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupSocket();
    this.currentToken = null;
    this.setStatus('disconnected');
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      this.socket = null;
    }
  }

  private setStatus(status: WSSocketStatus): void {
    this.socketStatus = status;
    this.emit('SOCKET_STATUS', status);
  }

  public on<T = unknown>(event: WSEventType | string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<any>);

    return () => {
      this.listeners.get(event)?.delete(callback as EventCallback<any>);
    };
  }

  public emit(event: WSEventType | string, payload: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[WebSocket] Listener error for ${event}:`, err);
        }
      });
    }
  }

  public getStatus(): WSSocketStatus {
    return this.socketStatus;
  }

  public isConnected(): boolean {
    return this.socketStatus === 'connected' && this.socket?.readyState === WebSocket.OPEN;
  }
}

export const webSocketService = new WebSocketService();
