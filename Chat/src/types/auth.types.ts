export interface UserSession {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  email: string;
  phone?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  about: string;
  token: string;
}

export interface AuthResponse {
  user: UserSession;
  token: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  phone_number?: string;
  password?: string;
}
