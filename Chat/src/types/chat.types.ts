export type UserPresence = 'online' | 'offline' | 'away' | 'busy';

export interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  status: UserPresence;
  about: string;
  phone: string;
  email?: string;
  lastSeen?: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'error';

export type AttachmentType = 'image' | 'video' | 'document' | 'audio' | 'location' | 'contact';

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  name?: string;
  size?: string;
  mimeType?: string;
  duration?: string;
  thumbnailUrl?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  contactName?: string;
  contactPhone?: string;
  contactAvatar?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface ReplyPreview {
  id: string;
  senderName: string;
  text: string;
  attachmentType?: AttachmentType;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: MessageStatus;
  replyTo?: ReplyPreview;
  attachments?: Attachment[];
  reactions?: MessageReaction[];
  isStarred?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  isForwarded?: boolean;
  forwardedFromName?: string;
  updatedAt?: string;
  createdAt?: string;
}

export type ConversationType = 'direct' | 'group';

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  participantIds: string[];
  participants: User[];
  unreadCount: number;
  lastMessage?: Message;
  pinned: boolean;
  archived?: boolean;
  muted: boolean;
  createdAt: string;
  updatedAt: string;
  groupAvatar?: string;
  description?: string;
  isTyping?: boolean;
  typingUser?: string;
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'incoming' | 'outgoing' | 'missed' | 'active' | 'ended';

export interface CallLog {
  id: string;
  contactId: string;
  contact: User;
  type: CallType;
  status: CallStatus;
  timestamp: string;
  duration?: string;
}

export interface StatusItem {
  id: string;
  userId: string;
  user: User;
  mediaUrl?: string;
  caption?: string;
  timestamp: string;
  viewed: boolean;
  backgroundColor?: string;
}

export type ThemeMode = 'light' | 'dark';
export type ActiveTab = 'chats' | 'status' | 'calls' | 'settings' | 'profile';
