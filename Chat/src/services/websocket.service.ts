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

  private resolveWebSocketUrl(token: string): string {
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

    return `${baseUrl}/chat/?token=${encodeURIComponent(token)}`;
  }

  public connect(token: string): void {
    if (!token) {
      console.warn('[WebSocket] Cannot connect: auth token missing.');
      return;
    }

    // If already open with this token, do nothing
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.currentToken === token) {
      return;
    }

    this.intentionalDisconnect = false;
    this.cleanupSocket();
    this.currentToken = token;
    this.setStatus('connecting');

    const wsUrl = this.resolveWebSocketUrl(token);
    console.log(`[WebSocket] Connecting to user-level socket... (${wsUrl.split('?')[0]})`);

    try {
      this.socket = new WebSocket(wsUrl);

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

        // Auto-reconnect on unexpected disconnect (not auth 4001/4004)
        if (
          !this.intentionalDisconnect &&
          event.code !== 4001 &&
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

      case 'error':
        console.error('[WebSocket] Server error:', event);
        this.emit('ERROR', event);
        break;


      default:
        console.warn('[WebSocket] Unknown event type:', event);
    }
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

  public sendMessage(receiverId: string | number, content: string): boolean {
    const trimmed = content.trim();
    if (!trimmed || !receiverId) return false;

    // Clean numeric ID if string like "user_2"
    const numMatch = String(receiverId).match(/\d+/);
    const cleanReceiverId = numMatch ? parseInt(numMatch[0], 10) : receiverId;

    const payloadStr = JSON.stringify({
      type: 'message',
      receiver_id: cleanReceiverId,
      content: trimmed,
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payloadStr);
      return true;
    }

    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Socket connecting: Queuing message for transmission upon connect.');
      this.pendingQueue.push(payloadStr);
      return true;
    }

    console.warn('[WebSocket] Cannot send message: Socket is not open.');
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

    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Socket connecting: Queuing history request for transmission upon connect.');
      this.pendingQueue.push(payloadStr);
      return true;
    }

    console.warn('[WebSocket] Cannot fetch history: Socket is not open.');
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
