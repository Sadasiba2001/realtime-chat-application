// Single source of truth for which backend the app talks to.
//
// API base URL:
//   1. VITE_API_URL (explicit)
//   2. VITE_REMOTE_BACKEND_URL
//   3. '' -> same origin (the Vite dev server proxies /api to VITE_REMOTE_BACKEND_URL or localhost:8000)
//
// WebSocket base URL (always ends with /ws):
//   1. VITE_WS_URL (explicit, used as-is)
//   2. derived from the API base URL above (http -> ws, https -> wss)
//   3. derived from the browser location (the Vite dev server proxies /ws as well)

const clean = (value: unknown): string => String(value ?? '').trim().replace(/\/+$/, '');

const isLocalHost = (url: string): boolean => /^(wss?|https?):\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(url);

export const resolveApiBaseUrl = (): string => {
  const explicit = clean(import.meta.env.VITE_API_URL);
  if (explicit) return explicit;
  return clean(import.meta.env.VITE_REMOTE_BACKEND_URL);
};

export const resolveWebSocketBaseUrl = (): { url: string; source: string } => {
  const explicit = clean(import.meta.env.VITE_WS_URL);
  if (explicit) {
    return { url: explicit.endsWith('/ws') ? explicit : `${explicit}/ws`, source: 'VITE_WS_URL' };
  }

  const apiBase = resolveApiBaseUrl();
  if (/^https?:\/\//i.test(apiBase)) {
    return { url: `${apiBase.replace(/^http/i, 'ws')}/ws`, source: 'API base URL' };
  }

  if (typeof window !== 'undefined' && window.location?.host) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return { url: `${protocol}://${window.location.host}/ws`, source: 'browser location' };
  }

  return { url: 'ws://localhost:8000/ws', source: 'default' };
};

export const describeEnvironment = (url: string): 'local' | 'remote' => (isLocalHost(url) ? 'local' : 'remote');
