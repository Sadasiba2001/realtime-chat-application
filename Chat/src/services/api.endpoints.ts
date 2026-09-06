export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/v1/auth/register/',
    LOGIN: '/api/v1/auth/login/',
    LOGOUT: '/api/v1/auth/logout/',
    SEARCH_USERS: '/api/v1/auth/users/search/',
    USERS: '/api/v1/auth/users/',
    PROFILE_IMAGE: '/api/v1/auth/users/profile-image/',
    VERIFY_EMAIL: '/api/v1/auth/verify-email/',
    RESEND_VERIFICATION: '/api/v1/auth/resend-verification/',
    FORGOT_PASSWORD: '/api/v1/auth/password/forgot/',
    VERIFY_RESET_TOKEN: '/api/v1/auth/password/verify-token/',
    RESET_PASSWORD: '/api/v1/auth/password/reset/',
  },
  CHAT: {
    CONVERSATIONS: '/api/chat/conversations/',
  },
} as const;
