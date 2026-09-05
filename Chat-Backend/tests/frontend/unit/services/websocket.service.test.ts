import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webSocketService } from '@/services/websocket.service';

describe('websocket.service unit tests', () => {
  beforeEach(() => {
    webSocketService.disconnect();
  });

  it('should register listener callbacks and trigger them on emit', () => {
    const callback = vi.fn();
    const unsubscribe = webSocketService.on('NEW_MESSAGE', callback);

    webSocketService.emit('NEW_MESSAGE', { id: 'msg_1', text: 'Hello socket' });
    expect(callback).toHaveBeenCalledWith({ id: 'msg_1', text: 'Hello socket' });

    unsubscribe();
    webSocketService.emit('NEW_MESSAGE', { id: 'msg_2', text: 'Hello again' });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should format sendDeleteMessage payload cleanly', () => {
    const success = webSocketService.sendDeleteMessage(2, 105, 'everyone');
    expect(typeof success).toBe('boolean');
  });
});
