import type { WSEventType } from '../types/websocket.types';

type EventCallback = (data: unknown) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<WSEventType, Set<EventCallback>> = new Map();
  private isConnected: boolean = false;

  public connect(token: string): void {
    if (this.isConnected) return;

    // Real WebSocket initialization:
    // this.socket = new WebSocket(`${WS_BASE_URL}?token=${token}`);
    this.isConnected = true;
    this.emitLocal('CONNECT', { status: 'connected', timestamp: new Date().toISOString() });

    console.log(`[WebSocket] Connected with session token (${token.slice(0, 10)}...)`);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.emitLocal('DISCONNECT', { status: 'disconnected' });
  }

  public on(event: WSEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public send(event: WSEventType, payload: unknown): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, payload }));
    } else {
      // Simulate real-time event distribution locally for frontend mode
      this.emitLocal(event, payload);
    }
  }

  public emitLocal(event: WSEventType, payload: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((cb) => cb(payload));
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();
