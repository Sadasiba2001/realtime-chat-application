/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  User,
  Conversation,
  Message,
  MessageStatus,
  Attachment,
  ReplyPreview,
  ThemeMode,
  ActiveTab,
  CallType,
  CallLog,
  StatusItem,
  FilterCategory,
} from '../types/chat.types';
import type { ToastNotificationData } from '../components/common/NotificationToast';
import { showBrowserPushNotification } from '../utils/browserNotification.utils';

import type {
  BackendMessagePayload,
  WSHistoryEvent,
  WSMessageStatusEvent,
  WSMessageDeleteEvent,
  WSMessageEditedEvent,
  WSProfileUpdateEvent,
  WSPresenceEvent,
  WSSocketStatus,
  WSMessageReactionEvent,
} from '../types/websocket.types';



import { userService } from '../services/user.service';
import { chatService } from '../services/chat.service';
import { webSocketService } from '../services/websocket.service';
import { storage } from '../utils/storage.utils';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime } from '../utils/date.utils';
import { getDirectConversationId, getTargetUserIdFromConversation } from '../utils/conversation.utils';

export type FilterCategory = 'all' | 'unread' | 'favorites' | 'groups' | 'archived';


export interface ActiveCallState {
  contact: User;
  type: CallType;
  isMuted: boolean;
  isVideoOff: boolean;
}

interface ChatContextType {
  currentUser: User;
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  activeMessages: Message[];
  activeTab: ActiveTab;
  theme: ThemeMode;
  searchQuery: string;
  inChatSearchQuery: string;
  filterCategory: FilterCategory;
  replyingToMessage: ReplyPreview | null;
  editingMessage: Message | null;
  activeCall: ActiveCallState | null;
  callLogs: CallLog[];
  statuses: StatusItem[];
  isMobileView: boolean;
  mobileShowChat: boolean;
  activeModal: string | null;
  modalPayload: unknown;
  socketStatus: WSSocketStatus;
  isLoadingHistory: boolean;
  hasMoreHistory: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  selectConversation: (id: string | null) => void;
  sendMessage: (text: string, attachments?: Attachment[]) => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string, deleteType?: 'me' | 'everyone') => Promise<void>;
  toggleStarMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  forwardMessage: (messageId: string, targetUserIds: string | string[]) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  activeNotification: ToastNotificationData | null;
  dismissNotification: () => void;
  setReplyTo: (reply: ReplyPreview | null) => void;
  setEditingMessage: (message: Message | null) => void;
  togglePin: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  toggleMute: (id: string) => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  reportUser: (targetUserId: string, reason: string, description?: string) => Promise<void>;
  createNewChat: (contact: User) => Promise<void>;
  createNewGroup: (name: string, members: User[]) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  removeProfilePicture: () => Promise<void>;
  toggleTheme: () => void;

  startCall: (contact: User, type: CallType) => void;
  endCall: () => void;
  toggleCallMute: () => void;
  toggleCallVideo: () => void;
  openModal: (modal: string, payload?: unknown) => void;
  closeModal: () => void;
  setFilterCategory: (category: FilterCategory) => void;
  setSearchQuery: (query: string) => void;
  setInChatSearchQuery: (query: string) => void;
  backToChatListMobile: () => void;
  loadMoreHistory: () => Promise<void>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storeUser = useAuthStore((state) => state.user);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const su = useAuthStore.getState().user;
    if (su) {
      return {
        id: String(su.id),
        name: su.name,
        username: su.username,
        avatar: su.avatar && !su.avatar.includes('images.unsplash.com') ? su.avatar : '',
        status: su.status || 'online',
        about: su.about || '',
        phone: su.phone || '',
        email: su.email,
      };
    }
    return {
      id: '',
      name: 'User',
      username: '',
      avatar: '',
      status: 'offline',
      about: 'Available',
      phone: '',
      email: '',
    };
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messagesMapState, setMessagesMapState] = useState<Record<string, Message[]>>(() => storage.getMessagesMap<Message>());

  const setMessagesMap: React.Dispatch<React.SetStateAction<Record<string, Message[]>>> = useCallback(
    (action) => {
      setMessagesMapState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        storage.setMessagesMap(next);
        return next;
      });
    },
    []
  );
  const messagesMap = messagesMapState;
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [theme, setTheme] = useState<ThemeMode>(() => storage.getTheme());
  const [searchQuery, setSearchQuery] = useState('');
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [replyingToMessage, setReplyingToMessage] = useState<ReplyPreview | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [activeNotification, setActiveNotification] = useState<ToastNotificationData | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [callLogs] = useState<CallLog[]>([]);
  const [statuses] = useState<StatusItem[]>([]);


  // WebSocket & Pagination State
  const [socketStatus, setSocketStatus] = useState<WSSocketStatus>('disconnected');
  const [historyPages, setHistoryPages] = useState<Record<string, number>>({});
  const [hasMoreHistoryMap, setHasMoreHistoryMap] = useState<Record<string, boolean>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Responsive & Modal state
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<unknown>(null);

  const activeConversationIdRef = useRef<string | null>(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  const currentUserRef = useRef<User>(currentUser);
  currentUserRef.current = currentUser;

  const conversationsRef = useRef<Conversation[]>(conversations);
  conversationsRef.current = conversations;

  const allUsersRef = useRef<User[]>([]);

  // Sync storeUser with currentUser and ensure user-level WebSocket is connected
  useEffect(() => {
    if (storeUser) {
      const cleanAvatar = storeUser.avatar && !storeUser.avatar.includes('images.unsplash.com') ? storeUser.avatar : '';
      const updated: User = {
        id: String(storeUser.id),
        name: storeUser.name,
        username: storeUser.username,
        avatar: cleanAvatar,
        status: storeUser.status || 'online',
        about: storeUser.about || '',
        phone: storeUser.phone || '',
        email: storeUser.email,
      };
      setCurrentUser(updated);
      currentUserRef.current = updated;


      const token = storage.getAuthToken();
      if (token) {
        webSocketService.connect(token);
      }
    }
  }, [storeUser]);

  // Theme synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);

  // Responsive window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to map backend message to frontend Message model
  const mapBackendMessage = useCallback(
    (backendMsg: BackendMessagePayload & { reactions?: any[]; is_deleted?: boolean; reply_to?: any }, targetConvId: string): Message => {
      const reactions = (backendMsg.reactions || []).map((r: any) => ({
        emoji: r.emoji,
        userId: String(r.user_id),
        userName: r.user_name || `User ${r.user_id}`,
      }));

      const replyTo = backendMsg.reply_to
        ? {
            id: String(backendMsg.reply_to.id),
            senderName: backendMsg.reply_to.sender_name || `User ${backendMsg.reply_to.sender_id}`,
            text: backendMsg.reply_to.is_deleted ? 'This message was deleted' : backendMsg.reply_to.content,
          }
        : undefined;

      return {
        id: String(backendMsg.id),
        conversationId: targetConvId,
        senderId: String(backendMsg.sender_id),
        text: backendMsg.content,
        timestamp: formatMessageTime(backendMsg.created_at),
        status: (backendMsg.status as MessageStatus) || 'sent',
        isEdited: Boolean(backendMsg.is_edited),
        isDeleted: Boolean(backendMsg.is_deleted) || backendMsg.content === 'This message was deleted',
        isForwarded: Boolean(backendMsg.is_forwarded),
        forwardedFromName: backendMsg.forwarded_from_name || undefined,
        reactions,
        replyTo,
        updatedAt: backendMsg.updated_at,
        createdAt: backendMsg.created_at,
      };
    },
    []
  );

  // Set up WebSocket global event listeners (Persistent for current user)
  useEffect(() => {
    const unsubStatus = webSocketService.on<WSSocketStatus>('SOCKET_STATUS', (status) => {
      console.log('[ChatContext] Persistent socket status:', status);
      setSocketStatus(status);

      if (status === 'connected' && activeConversationIdRef.current) {
        const activeConv = conversationsRef.current.find((c) => c.id === activeConversationIdRef.current);
        if (activeConv && activeConv.type === 'direct') {
          const targetId = getTargetUserIdFromConversation(currentUserRef.current.id, activeConv.participantIds);
          if (targetId) {
            webSocketService.fetchHistory(targetId, 1, 50);
          }
        }
      }
    });

    const unsubNewMessage = webSocketService.on<BackendMessagePayload>('NEW_MESSAGE', (payload) => {
      console.log('[ChatContext] Real-time message received:', payload);

      // Deterministic conversation ID for this 1-to-1 pair
      const convId = getDirectConversationId(payload.sender_id, payload.receiver_id);
      const newMsg = mapBackendMessage(payload, convId);

      const currentMyIdStr = String(currentUserRef.current.id);
      const myIdMatch = currentMyIdStr.match(/\d+/);
      const senderMatch = String(payload.sender_id).match(/\d+/);
      
      const isMyMessage = (myIdMatch && senderMatch)
        ? myIdMatch[0] === senderMatch[0]
        : String(payload.sender_id) === currentMyIdStr;

      const otherId = isMyMessage ? String(payload.receiver_id) : String(payload.sender_id);
      const isCurrentActive = convId === activeConversationIdRef.current;

      // If incoming message addressed to current user, acknowledge delivery and read
      if (!isMyMessage) {
        webSocketService.sendDeliveryReceipt(payload.id);

        if (isCurrentActive) {
          webSocketService.sendReadReceipt(payload.sender_id, [payload.id]);
          newMsg.status = 'read';
        } else {
          // Trigger real-time notification toast for incoming message when chat not active
          const senderUser = allUsersRef.current.find((u) => String(u.id) === String(payload.sender_id));
          const senderTitle = senderUser?.name || payload.sender_name || `User ${payload.sender_id}`;
          setActiveNotification({
            id: `msg_${payload.id}_${Date.now()}`,
            type: 'new_message',
            title: senderTitle,
            body: payload.content,
            avatar: senderUser?.avatar,
            conversationId: convId,
          });
          showBrowserPushNotification(
            senderTitle,
            { body: payload.content, conversationId: convId },
            (targetId) => {
              if (targetId) selectConversation(targetId);
            }
          );
        }
      }

      // 1. Insert/update message in that conversation's message list
      setMessagesMap((prev) => {
        const existingList = prev[convId] || [];

        // Reconcile optimistic message sent by this user
        const optimisticIndex = existingList.findIndex(
          (m) =>
            m.id.startsWith('temp_') &&
            (String(m.senderId) === String(payload.sender_id) || (myIdMatch && String(m.senderId).includes(myIdMatch[0]))) &&
            m.text.trim() === payload.content.trim()
        );

        if (optimisticIndex > -1) {
          const updated = [...existingList];
          updated[optimisticIndex] = newMsg;
          return { ...prev, [convId]: updated };
        }

        // Prevent duplicate messages
        if (existingList.some((m) => String(m.id) === String(newMsg.id))) {
          return prev;
        }

        return {
          ...prev,
          [convId]: [...existingList, newMsg],
        };
      });

      // 2. Update conversation list and unread counts (and move conversation to top)
      setConversations((prev) => {
        const existingConv = prev.find((c) => c.id === convId);

        if (existingConv) {
          const updatedConv: Conversation = {
            ...existingConv,
            lastMessage: newMsg,
            unreadCount: isCurrentActive ? 0 : (existingConv.unreadCount || 0) + (!isMyMessage ? 1 : 0),
            updatedAt: newMsg.createdAt || new Date().toISOString(),
          };
          const rest = prev.filter((c) => c.id !== convId);
          return [updatedConv, ...rest];
        }

        // If conversation not yet present in list, dynamically add it to the top
        const knownOtherUser = allUsersRef.current.find((u) => {
          const uMatch = String(u.id).match(/\d+/);
          const oMatch = String(otherId).match(/\d+/);
          if (uMatch && oMatch) return uMatch[0] === oMatch[0];
          return String(u.id) === String(otherId);
        }) || {
          id: otherId,
          name: `User ${otherId}`,
          avatar: '',
          status: 'online',
          about: 'Available',
          phone: '',
        };

        const newConversation: Conversation = {
          id: convId,
          type: 'direct',
          participantIds: [currentMyIdStr, otherId],
          participants: [currentUserRef.current, knownOtherUser],
          unreadCount: isCurrentActive ? 0 : (!isMyMessage ? 1 : 0),
          lastMessage: newMsg,
          pinned: false,
          muted: false,
          createdAt: newMsg.createdAt || new Date().toISOString(),
          updatedAt: newMsg.createdAt || new Date().toISOString(),
        };

        return [newConversation, ...prev];
      });
    });

    const unsubMessageStatus = webSocketService.on<WSMessageStatusEvent>('MESSAGE_STATUS_UPDATE', (event) => {
      console.log('[ChatContext] MESSAGE_STATUS_UPDATE received:', event);
      const newStatus = event.status;
      const rawIds = event.message_ids || (event.message_id !== undefined ? [event.message_id] : []);
      if (rawIds.length === 0) return;

      const targetIdStrs = new Set(rawIds.map((id) => String(id)));
      const targetNumericIds = new Set(
        rawIds
          .map((id) => {
            const match = String(id).match(/\d+/);
            return match ? match[0] : null;
          })
          .filter(Boolean)
      );

      // Update messagesMap
      setMessagesMap((prev) => {
        let anyChanged = false;
        const nextState: Record<string, Message[]> = {};

        for (const [cId, list] of Object.entries(prev)) {
          let listChanged = false;
          const updatedList = list.map((msg) => {
            const mStr = String(msg.id);
            const mMatch = mStr.match(/\d+/);
            const isMatch = targetIdStrs.has(mStr) || (mMatch && targetNumericIds.has(mMatch[0]));

            if (isMatch) {
              // Never regress status
              if (msg.status === 'read' && (newStatus === 'delivered' || newStatus === 'sent')) {
                return msg;
              }
              if (msg.status === 'delivered' && newStatus === 'sent') {
                return msg;
              }
              if (msg.status !== newStatus) {
                listChanged = true;
                anyChanged = true;
                return { ...msg, status: newStatus };
              }
            }
            return msg;
          });

          nextState[cId] = listChanged ? updatedList : list;
        }

        return anyChanged ? nextState : prev;
      });

      // Update lastMessage in conversations list
      setConversations((prev) =>
        prev.map((conv) => {
          if (!conv.lastMessage) return conv;
          const lmStr = String(conv.lastMessage.id);
          const lmMatch = lmStr.match(/\d+/);
          const isMatch = targetIdStrs.has(lmStr) || (lmMatch && targetNumericIds.has(lmMatch[0]));

          if (isMatch) {
            if (conv.lastMessage.status === 'read' && (newStatus === 'delivered' || newStatus === 'sent')) {
              return conv;
            }
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                status: newStatus,
              },
            };
          }
          return conv;
        })
      );
    });

    const unsubHistory = webSocketService.on<WSHistoryEvent>('HISTORY_LOADED', (event) => {
      console.log('[ChatContext] HISTORY_LOADED received:', event);
      setIsLoadingHistory(false);

      const targetId = event.target_user_id;
      if (!targetId) return;

      const convId = getDirectConversationId(currentUserRef.current.id, targetId);
      const payload = event.data;
      const results = payload.results || [];
      const formattedMsgs = results.map((item) => mapBackendMessage(item, convId));

      const currentMyId = String(currentUserRef.current.id);
      const myMatch = currentMyId.match(/\d+/);

      // Acknowledge delivery for any incoming messages still 'sent'
      const incomingSentIds = results
        .filter((item) => {
          const sMatch = String(item.sender_id).match(/\d+/);
          const isIncoming = myMatch && sMatch
            ? myMatch[0] !== sMatch[0]
            : String(item.sender_id) !== currentMyId;
          return isIncoming && (!item.status || item.status === 'sent');
        })
        .map((item) => item.id);

      if (incomingSentIds.length > 0) {
        webSocketService.sendDeliveryReceipt(incomingSentIds);
      }

      // If active conversation, mark unread incoming messages as read
      const incomingUnreadIds = results
        .filter((item) => {
          const sMatch = String(item.sender_id).match(/\d+/);
          const isIncoming = myMatch && sMatch
            ? myMatch[0] !== sMatch[0]
            : String(item.sender_id) !== currentMyId;
          return isIncoming && item.status !== 'read';
        })
        .map((item) => item.id);

      if (convId === activeConversationIdRef.current && incomingUnreadIds.length > 0) {
        webSocketService.sendReadReceipt(targetId, incomingUnreadIds);
      }

      setMessagesMap((prev) => {
        const existing = prev[convId] || [];
        const page = payload.page || 1;

        if (page === 1) {
          const existingById = new Map(existing.map((m) => [m.id, m]));
          formattedMsgs.forEach((m) => existingById.set(m.id, m));
          const merged = Array.from(existingById.values()).sort(
            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          );
          return { ...prev, [convId]: merged };
        } else {
          const existingIds = new Set(existing.map((m) => m.id));
          const olderUnique = formattedMsgs.filter((m) => !existingIds.has(m.id));
          const merged = [...olderUnique, ...existing].sort(
            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          );
          return { ...prev, [convId]: merged };
        }
      });

      setHistoryPages((prev) => ({ ...prev, [convId]: payload.page || 1 }));
      setHasMoreHistoryMap((prev) => ({
        ...prev,
        [convId]: (payload.page || 1) * (payload.page_size || 50) < payload.count,
      }));

      // Update last message in conversation list
      if (formattedMsgs.length > 0) {
        const latest = formattedMsgs[formattedMsgs.length - 1];
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, lastMessage: latest } : c))
        );
      }
    });

    const unsubPresence = webSocketService.on<WSPresenceEvent>('PRESENCE_CHANGE', (event) => {
      console.log('[ChatContext] Real-time presence update received:', event);
      const targetUserId = String(event.user_id).trim();
      const newStatus = event.status;
      const newLastSeen = event.last_seen;
      const targetMatch = targetUserId.match(/\d+/);

      setConversations((prev) =>
        prev.map((conv) => {
          let hasParticipant = false;
          const updatedParticipants = conv.participants.map((p) => {
            const pIdStr = String(p.id).trim();
            const pMatch = pIdStr.match(/\d+/);

            const isMatch = targetMatch && pMatch
              ? targetMatch[0] === pMatch[0]
              : pIdStr === targetUserId;

            if (isMatch) {
              hasParticipant = true;
              return {
                ...p,
                status: newStatus,
                lastSeen: newLastSeen || p.lastSeen,
              };
            }
            return p;
          });

          if (hasParticipant) {
            return {
              ...conv,
              participants: updatedParticipants,
            };
          }
          return conv;
        })
      );
    });

    const unsubProfileUpdate = webSocketService.on<WSProfileUpdateEvent>('PROFILE_UPDATE', (event) => {
      console.log('[ChatContext] Real-time PROFILE_UPDATE event received:', event);
      const targetUserId = String(event.user_id).trim();
      const newAvatar = event.profile_image_url || event.profile_image || event.avatar || '';
      const targetMatch = targetUserId.match(/\d+/);

      const myIdStr = String(currentUserRef.current.id).trim();
      const myMatch = myIdStr.match(/\d+/);
      const isMe = targetMatch && myMatch ? targetMatch[0] === myMatch[0] : targetUserId === myIdStr;

      if (isMe) {
        setCurrentUser((prev) => ({ ...prev, avatar: newAvatar }));
      }

      setConversations((prev) =>
        prev.map((conv) => {
          let hasParticipant = false;
          const updatedParticipants = conv.participants.map((p) => {
            const pIdStr = String(p.id).trim();
            const pMatch = pIdStr.match(/\d+/);
            const isMatch = targetMatch && pMatch ? targetMatch[0] === pMatch[0] : pIdStr === targetUserId;
            if (isMatch) {
              hasParticipant = true;
              return { ...p, avatar: newAvatar };
            }
            return p;
          });

          if (hasParticipant) {
            return { ...conv, participants: updatedParticipants };
          }
          return conv;
        })
      );

      allUsersRef.current = allUsersRef.current.map((u) => {
        const uIdStr = String(u.id).trim();
        const uMatch = uIdStr.match(/\d+/);
        const isMatch = targetMatch && uMatch ? targetMatch[0] === uMatch[0] : uIdStr === targetUserId;
        return isMatch ? { ...u, avatar: newAvatar } : u;
      });
    });

    const unsubDeleteMessage = webSocketService.on<WSMessageDeleteEvent>('MESSAGE_DELETED', (event) => {
      console.log('[ChatContext] Real-time MESSAGE_DELETED event received:', event);
      const msgIdStr = String(event.message_id);

      if (event.delete_type === 'everyone') {
        storage.addDeletedForEveryone(msgIdStr);

        setMessagesMap((prev) => {
          let anyChanged = false;
          const nextState: Record<string, Message[]> = {};

          for (const [cId, list] of Object.entries(prev)) {
            let listChanged = false;
            const updatedList = list.map((m) => {
              const mStr = String(m.id);
              const mMatch = mStr.match(/\d+/);
              const targetMatch = msgIdStr.match(/\d+/);
              const isMatch = mStr === msgIdStr || (mMatch && targetMatch && mMatch[0] === targetMatch[0]);

              if (isMatch) {
                listChanged = true;
                anyChanged = true;
                return { ...m, isDeleted: true, text: 'This message was deleted' };
              }
              return m;
            });

            nextState[cId] = listChanged ? updatedList : list;
          }

          return anyChanged ? nextState : prev;
        });

        setConversations((prev) =>
          prev.map((c) => {
            if (c.lastMessage) {
              const lmStr = String(c.lastMessage.id);
              const lmMatch = lmStr.match(/\d+/);
              const targetMatch = msgIdStr.match(/\d+/);
              const isMatch = lmStr === msgIdStr || (lmMatch && targetMatch && lmMatch[0] === targetMatch[0]);
              if (isMatch) {
                return {
                  ...c,
                  lastMessage: {
                    ...c.lastMessage,
                    isDeleted: true,
                    text: 'This message was deleted',
                  },
                };
              }
            }
            return c;
          })
        );
      } else if (event.delete_type === 'me') {
        storage.addDeletedForMe(msgIdStr);

        setMessagesMap((prev) => {
          let anyChanged = false;
          const nextState: Record<string, Message[]> = {};

          for (const [cId, list] of Object.entries(prev)) {
            const targetMatch = msgIdStr.match(/\d+/);
            const filteredList = list.filter((m) => {
              const mStr = String(m.id);
              const mMatch = mStr.match(/\d+/);
              const isMatch = mStr === msgIdStr || (mMatch && targetMatch && mMatch[0] === targetMatch[0]);
              return !isMatch;
            });

            if (filteredList.length !== list.length) {
              anyChanged = true;
              nextState[cId] = filteredList;
            } else {
              nextState[cId] = list;
            }
          }

          return anyChanged ? nextState : prev;
        });
      }
    });

    const unsubEditMessage = webSocketService.on<WSMessageEditedEvent>('MESSAGE_EDITED', (event) => {
      console.log('[ChatContext] Real-time MESSAGE_EDITED event received:', event);
      const payload = event.data;
      if (!payload || !payload.id) return;

      const editedMsgIdStr = String(payload.id);
      const targetMatch = editedMsgIdStr.match(/\d+/);

      setMessagesMap((prev) => {
        let anyChanged = false;
        const nextState: Record<string, Message[]> = {};

        for (const [cId, list] of Object.entries(prev)) {
          let listChanged = false;
          const updatedList = list.map((m) => {
            const mStr = String(m.id);
            const mMatch = mStr.match(/\d+/);
            const isMatch = mStr === editedMsgIdStr || (mMatch && targetMatch && mMatch[0] === targetMatch[0]);

            if (isMatch) {
              listChanged = true;
              anyChanged = true;
              return {
                ...m,
                text: payload.content,
                isEdited: true,
                updatedAt: payload.updated_at,
              };
            }
            return m;
          });

          nextState[cId] = listChanged ? updatedList : list;
        }

        return anyChanged ? nextState : prev;
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.lastMessage) {
            const lmStr = String(c.lastMessage.id);
            const lmMatch = lmStr.match(/\d+/);
            const isMatch = lmStr === editedMsgIdStr || (lmMatch && targetMatch && lmMatch[0] === targetMatch[0]);
            if (isMatch) {
              return {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  text: payload.content,
                  isEdited: true,
                  updatedAt: payload.updated_at,
                },
              };
            }
          }
          return c;
        })
      );
    });

    const unsubReaction = webSocketService.on<WSMessageReactionEvent>('MESSAGE_REACTION_UPDATED', (event) => {
      console.log('[ChatContext] Real-time MESSAGE_REACTION_UPDATED event received:', event);
      const payload = event.data;
      if (!payload || !payload.message_id) return;

      const targetMsgIdStr = String(payload.message_id);
      const targetMatch = targetMsgIdStr.match(/\d+/);

      const newReactions = (payload.reactions || []).map((r: any) => ({
        emoji: r.emoji,
        userId: String(r.user_id),
        userName: r.user_name || `User ${r.user_id}`,
      }));

      setMessagesMap((prev) => {
        let anyChanged = false;
        const nextState: Record<string, Message[]> = {};

        for (const [cId, list] of Object.entries(prev)) {
          let listChanged = false;
          const updatedList = list.map((m) => {
            const mStr = String(m.id);
            const mMatch = mStr.match(/\d+/);
            const isMatch = mStr === targetMsgIdStr || (mMatch && targetMatch && mMatch[0] === targetMatch[0]);

            if (isMatch) {
              listChanged = true;
              anyChanged = true;

              // If someone else reacted to my message, trigger real-time notification
              if (String(m.senderId) === String(currentUserRef.current.id) && payload.user_id !== currentUserRef.current.id) {
                const reacterName = payload.user_name || `User ${payload.user_id}`;
                const emoji = payload.emoji || payload.reactions?.[0]?.emoji || '❤️';
                const rxnTitle = `${reacterName} reacted ${emoji}`;
                const rxnBody = `on your message: "${m.text}"`;
                setActiveNotification({
                  id: `rxn_${payload.message_id}_${Date.now()}`,
                  type: 'reaction',
                  title: rxnTitle,
                  body: rxnBody,
                  conversationId: m.conversationId,
                });
                showBrowserPushNotification(
                  rxnTitle,
                  { body: rxnBody, conversationId: m.conversationId },
                  (targetId) => {
                    if (targetId) selectConversation(targetId);
                  }
                );
              }

              return {
                ...m,
                reactions: newReactions,
              };
            }
            return m;
          });

          nextState[cId] = listChanged ? updatedList : list;
        }

        return anyChanged ? nextState : prev;
      });
    });

    const unsubTyping = webSocketService.on<WSTypingStatusEvent>('USER_TYPING', (event) => {
      console.log('[ChatContext] Real-time USER_TYPING event received:', event);
      const targetId = String(event.conversation_user_id || event.user_id);
      const targetMatch = targetId.match(/\d+/);

      setConversations((prev) =>
        prev.map((c) => {
          const cMatch = String(c.id).match(/\d+/);
          const pMatch = c.participantIds?.[0]?.match(/\d+/);
          const isMatch =
            c.id === targetId ||
            (targetMatch && cMatch && targetMatch[0] === cMatch[0]) ||
            (targetMatch && pMatch && targetMatch[0] === pMatch[0]);

          if (isMatch) {
            return {
              ...c,
              isTyping: event.is_typing,
              typingUser: event.is_typing ? (event.user_name || 'Contact') : undefined,
            };
          }
          return c;
        })
      );
    });

    return () => {
      unsubStatus();
      unsubNewMessage();
      unsubMessageStatus();
      unsubDeleteMessage();
      unsubEditMessage();
      unsubReaction();
      unsubTyping();
      unsubHistory();
      unsubPresence();
      unsubProfileUpdate();
    };
  }, [mapBackendMessage]);




  // Load existing direct conversations from backend
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const activeMyUser = currentUserRef.current;
        const initialConversations = await chatService.getConversations(activeMyUser);
        setConversations(initialConversations);

        // Auto select first conversation if it exists
        if (initialConversations.length > 0 && !activeConversationIdRef.current) {
          const firstConv = initialConversations[0];
          setActiveConversationId(firstConv.id);
          const targetId = getTargetUserIdFromConversation(activeMyUser.id, firstConv.participantIds);
          if (targetId) {
            webSocketService.fetchHistory(targetId, 1, 50);
          }
        }
      } catch (err) {
        console.error('Failed to load initial conversations:', err);
      }
    };

    if (storeUser) {
      loadInitialData();
    }
  }, [storeUser]);


  // Fetch message history when switching conversations (without reconnecting WebSocket)
  const selectConversation = (id: string | null) => {
    setActiveConversationId(id);
    setReplyingToMessage(null);
    setInChatSearchQuery('');

    if (isMobileView && id) {
      setMobileShowChat(true);
    }

    if (id) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );

      const conv = conversations.find((c) => c.id === id);
      if (conv && conv.type === 'direct') {
        const targetId = getTargetUserIdFromConversation(currentUser.id, conv.participantIds);
        if (targetId) {
          // Send read receipt for this conversation's unread messages
          const existingMsgs = messagesMap[id] || [];
          const currentMyId = String(currentUser.id);
          const myMatch = currentMyId.match(/\d+/);
          const unreadIds = existingMsgs
            .filter((m) => {
              const sMatch = String(m.senderId).match(/\d+/);
              const isIncoming = myMatch && sMatch
                ? myMatch[0] !== sMatch[0]
                : String(m.senderId) !== currentMyId;
              return isIncoming && m.status !== 'read';
            })
            .map((m) => m.id);

          webSocketService.sendReadReceipt(targetId, unreadIds.length > 0 ? unreadIds : undefined);

          // Fetch latest history for this conversation
          webSocketService.fetchHistory(targetId, 1, 50);
        }
      }
    }
  };


  const backToChatListMobile = () => {
    setMobileShowChat(false);
  };

  const loadMoreHistory = async () => {
    if (!activeConversationId || isLoadingHistory) return;

    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv || conv.type !== 'direct') return;

    const targetId = getTargetUserIdFromConversation(currentUser.id, conv.participantIds);
    if (!targetId) return;

    const currentPage = historyPages[activeConversationId] || 1;
    const nextPage = currentPage + 1;

    setIsLoadingHistory(true);
    const sent = webSocketService.fetchHistory(targetId, nextPage, 50);
    if (!sent) {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async (text: string, attachments?: Attachment[]) => {
    if (!activeConversationId) return;

    const activeConv = conversations.find((c) => c.id === activeConversationId);
    const trimmed = text.trim();
    if (!trimmed && (!attachments || attachments.length === 0)) return;

    const targetUserId = activeConv
      ? getTargetUserIdFromConversation(currentUser.id, activeConv.participantIds)
      : null;

    if (!targetUserId) {
      console.warn('[ChatContext] Cannot send message: Target user not found.');
      return;
    }

    // Optimistic UI message display
    const optimisticMsg: Message = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      conversationId: activeConversationId,
      senderId: String(currentUser.id),
      text: trimmed,
      timestamp: formatMessageTime(new Date().toISOString()),
      status: 'sent',
      attachments,
      replyTo: replyingToMessage || undefined,
      createdAt: new Date().toISOString(),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), optimisticMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              lastMessage: optimisticMsg,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    const replyToId = replyingToMessage ? replyingToMessage.id : undefined;
    setReplyingToMessage(null);

    // Send through real Django WebSocket
    console.log(`[ChatContext] Sending WebSocket message to receiver ${targetUserId}:`, trimmed);
    let sent = webSocketService.sendMessage(targetUserId, trimmed, replyToId);
    if (!sent) {
      const token = storage.getAuthToken();
      if (token && !webSocketService.isConnected()) {
        console.log('[ChatContext] Socket disconnected. Reconnecting WebSocket and retrying send...');
        webSocketService.connect(token);
        // Brief retry after initiating connection
        setTimeout(() => {
          const retrySent = webSocketService.sendMessage(targetUserId, trimmed);
          if (!retrySent) {
            console.error('[ChatContext] Failed to dispatch message via WebSocket: Socket not connected.');
            setMessagesMap((prev) => ({
              ...prev,
              [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
                m.id === optimisticMsg.id ? { ...m, status: 'error' } : m
              ),
            }));
          }
        }, 500);
      } else {
        console.error('[ChatContext] Failed to dispatch message via WebSocket: Socket not connected.');
        setMessagesMap((prev) => ({
          ...prev,
          [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
            m.id === optimisticMsg.id ? { ...m, status: 'error' } : m
          ),
        }));
      }
    }
  };

  const editMessage = async (messageId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed || !messageId) return;

    webSocketService.editMessage(messageId, trimmed);

    const targetMatch = messageId.match(/\d+/);
    setMessagesMap((prev) => {
      let anyChanged = false;
      const nextState: Record<string, Message[]> = {};

      for (const [cId, list] of Object.entries(prev)) {
        let listChanged = false;
        const updatedList = list.map((m) => {
          const mStr = String(m.id);
          const mMatch = mStr.match(/\d+/);
          const isMatch = mStr === messageId || (mMatch && targetMatch && mMatch[0] === targetMatch[0]);

          if (isMatch) {
            listChanged = true;
            anyChanged = true;
            return {
              ...m,
              text: trimmed,
              isEdited: true,
              updatedAt: new Date().toISOString(),
            };
          }
          return m;
        });

        nextState[cId] = listChanged ? updatedList : list;
      }

      return anyChanged ? nextState : prev;
    });

    setConversations((prev) =>
      prev.map((c) => {
        if (c.lastMessage) {
          const lmStr = String(c.lastMessage.id);
          const lmMatch = lmStr.match(/\d+/);
          const isMatch = lmStr === messageId || (lmMatch && targetMatch && lmMatch[0] === targetMatch[0]);
          if (isMatch) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                text: trimmed,
                isEdited: true,
                updatedAt: new Date().toISOString(),
              },
            };
          }
        }
        return c;
      })
    );

    setEditingMessage(null);
  };

  const deleteMessage = async (messageId: string, deleteType: 'me' | 'everyone' = 'everyone') => {
    if (!activeConversationId) return;

    const activeConv = conversations.find((c) => c.id === activeConversationId);
    const targetUserId = activeConv
      ? getTargetUserIdFromConversation(currentUser.id, activeConv.participantIds)
      : null;

    if (deleteType === 'me') {
      storage.addDeletedForMe(messageId);
      if (targetUserId) {
        webSocketService.sendDeleteMessage(targetUserId, messageId, 'me');
      }
    } else {
      storage.addDeletedForEveryone(messageId);
      if (targetUserId) {
        webSocketService.sendDeleteMessage(targetUserId, messageId, 'everyone');
      }
    }

    setMessagesMap((prev) => {
      const currentList = prev[activeConversationId] || [];
      if (deleteType === 'me') {
        return {
          ...prev,
          [activeConversationId]: currentList.filter((m) => m.id !== messageId),
        };
      } else {
        return {
          ...prev,
          [activeConversationId]: currentList.map((m) =>
            m.id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted' } : m
          ),
        };
      }
    });

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConversationId || !c.lastMessage) return c;
        if (c.lastMessage.id === messageId) {
          if (deleteType === 'me') {
            const currentList = messagesMap[activeConversationId] || [];
            const remaining = currentList.filter((m) => m.id !== messageId);
            const newLastMsg = remaining.length > 0 ? remaining[remaining.length - 1] : undefined;
            return { ...c, lastMessage: newLastMsg };
          } else {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                isDeleted: true,
                text: 'This message was deleted',
              },
            };
          }
        }
        return c;
      })
    );
  };

  const toggleStarMessage = async (messageId: string) => {
    if (!activeConversationId) return;
    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
        m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
      ),
    }));
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!activeConversationId) return;
    webSocketService.sendReaction(messageId, emoji);
    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map((m) => {
        if (m.id === messageId) {
          const reactions = m.reactions || [];
          const existingIdx = reactions.findIndex((r) => r.userId === currentUser.id);
          const updated = [...reactions];
          if (existingIdx > -1) {
            if (updated[existingIdx].emoji === emoji) {
              updated.splice(existingIdx, 1);
            } else {
              updated[existingIdx] = { emoji, userId: currentUser.id, userName: currentUser.name };
            }
          } else {
            updated.push({ emoji, userId: currentUser.id, userName: currentUser.name });
          }
          return { ...m, reactions: updated };
        }
        return m;
      }),
    }));
  };

  const forwardMessage = async (messageId: string, targetUserIds: string | string[]) => {
    webSocketService.sendForward(messageId, targetUserIds);
  };

  const sendTyping = (isTyping: boolean) => {
    if (!activeConversationId) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (conv) {
      const targetId = getTargetUserIdFromConversation(currentUser.id, conv.participantIds);
      if (targetId) {
        webSocketService.sendTyping(targetId, isTyping);
      }
    }
  };

  const togglePin = async (id: string) => {
    await chatService.togglePinConversation(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const toggleArchive = async (id: string) => {
    await chatService.toggleArchiveConversation(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c))
    );
  };

  const toggleMute = async (id: string) => {
    await chatService.toggleMuteConversation(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c))
    );
  };

  const blockUser = async (targetUserId: string) => {
    await chatService.blockUser(targetUserId);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetUserId || c.participantIds.includes(targetUserId)) {
          return { ...c, isBlocked: true };
        }
        return c;
      })
    );
  };

  const unblockUser = async (targetUserId: string) => {
    await chatService.unblockUser(targetUserId);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetUserId || c.participantIds.includes(targetUserId)) {
          return { ...c, isBlocked: false };
        }
        return c;
      })
    );
  };

  const reportUser = async (targetUserId: string, reason: string, description?: string) => {
    await chatService.reportUser(targetUserId, reason, description);
    setActiveNotification({
      id: `note_${Date.now()}`,
      type: 'info',
      message: 'User reported successfully.',
    });
  };

  const createNewChat = async (contact: User) => {
    const myIdStr = String(currentUser.id).trim();
    const contactIdStr = String(contact.id).trim();
    const myMatch = myIdStr.match(/\d+/);
    const contactMatch = contactIdStr.match(/\d+/);
    if (myIdStr === contactIdStr || (myMatch && contactMatch && myMatch[0] === contactMatch[0])) {
      console.warn('[ChatContext] Cannot start conversation with self.');
      closeModal();
      return;
    }

    const conv = await chatService.createDirectConversation(currentUser, contact);
    setConversations((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
    selectConversation(conv.id);
    closeModal();
  };

  const createNewGroup = async (name: string, members: User[]) => {
    const conv = await chatService.createGroupConversation(currentUser, name, members);
    setConversations((prev) => [conv, ...prev]);
    selectConversation(conv.id);
    closeModal();
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    const updated = await userService.updateProfile(updates);
    setCurrentUser(updated);
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    const result = await userService.uploadProfileImage(file);
    const newAvatarUrl = result.profile_image_url || '';
    setCurrentUser((prev) => ({ ...prev, avatar: newAvatarUrl }));
    return newAvatarUrl;
  };

  const removeProfilePicture = async (): Promise<void> => {
    await userService.deleteProfileImage();
    setCurrentUser((prev) => ({ ...prev, avatar: '' }));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };


  const startCall = (contact: User, type: CallType) => {
    setActiveCall({
      contact,
      type,
      isMuted: false,
      isVideoOff: false,
    });
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const toggleCallMute = () => {
    setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
  };

  const toggleCallVideo = () => {
    setActiveCall((prev) => (prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null));
  };

  const openModal = (modal: string, payload: unknown = null) => {
    setActiveModal(modal);
    setModalPayload(payload);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const activeMessages = activeConversationId ? messagesMap[activeConversationId] || [] : [];
  const hasMoreHistory = activeConversationId ? hasMoreHistoryMap[activeConversationId] ?? false : false;

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        conversations,
        activeConversationId,
        activeConversation,
        activeMessages,
        activeTab,
        theme,
        searchQuery,
        inChatSearchQuery,
        filterCategory,
        replyingToMessage,
        editingMessage,
        activeCall,
        callLogs,
        statuses,
        isMobileView,
        mobileShowChat,
        activeModal,
        modalPayload,
        socketStatus,
        isLoadingHistory,
        hasMoreHistory,
        setActiveTab,
        selectConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleStarMessage,
        addReaction,
        forwardMessage,
        sendTyping,
        activeNotification,
        dismissNotification: () => setActiveNotification(null),
        setReplyTo: setReplyingToMessage,
        setEditingMessage,
        togglePin,
        toggleArchive,
        toggleMute,
        blockUser,
        unblockUser,
        reportUser,
        createNewChat,
        createNewGroup,
        updateUserProfile,
        uploadProfilePicture,
        removeProfilePicture,
        toggleTheme,

        startCall,
        endCall,
        toggleCallMute,
        toggleCallVideo,
        openModal,
        closeModal,
        setFilterCategory,
        setSearchQuery,
        setInChatSearchQuery,
        backToChatListMobile,
        loadMoreHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
