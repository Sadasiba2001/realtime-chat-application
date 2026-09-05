import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock lucide-react icons for DOM rendering tests
vi.mock('lucide-react', () => ({
  X: (props: any) => React.createElement('span', { 'data-testid': 'close-icon', onClick: props.onClick }),
  Check: () => React.createElement('span', null, 'check'),
  CheckCheck: () => React.createElement('span', null, 'check-check'),
  Star: () => React.createElement('span', null, 'star'),
  Trash2: () => React.createElement('span', null, 'trash'),
  Reply: () => React.createElement('span', null, 'reply'),
  Smile: () => React.createElement('span', null, 'smile'),
  FileText: () => React.createElement('span', null, 'file'),
  Download: () => React.createElement('span', null, 'download'),
  MapPin: () => React.createElement('span', null, 'pin'),
  User: () => React.createElement('span', null, 'user'),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock WebRTC MediaDevices & WebSocket
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    userAgent: 'node.js',
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [],
      }),
    },
  },
  writable: true,
});

class MockWebSocket {
  public static OPEN = 1;
  public readyState = 1;
  public onopen: (() => void) | null = null;
  public onclose: (() => void) | null = null;
  public onmessage: ((e: MessageEvent) => void) | null = null;
  public onerror: ((e: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  public send(data: string) {
    return data;
  }

  public close() {
    if (this.onclose) this.onclose();
  }
}

Object.defineProperty(window, 'WebSocket', {
  value: MockWebSocket,
  writable: true,
});
