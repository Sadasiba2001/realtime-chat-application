export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/v1/auth/register/',
    LOGIN: '/api/v1/auth/login/',
    LOGOUT: '/api/v1/auth/logout/',
    SEARCH_USERS: '/api/v1/auth/users/search/',
    USERS: '/api/v1/auth/users/',
  },
  CHAT: {
    CONVERSATIONS: '/api/chat/conversations/',
  },
} as const;

