/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  User,
  Conversation,
  Message,
  Attachment,
  ReplyPreview,
  ThemeMode,
  ActiveTab,
  CallType,
  CallLog,
  StatusItem,
} from '../types/chat.types';
import type {
  BackendMessagePayload,
  WSHistoryEvent,
  WSSocketStatus,
} from '../types/websocket.types';
import { userService } from '../services/user.service';
import { chatService } from '../services/chat.service';
import { webSocketService } from '../services/websocket.service';
import { storage } from '../utils/storage.utils';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime } from '../utils/date.utils';
import { getDirectConversationId, getTargetUserIdFromConversation } from '../utils/conversation.utils';
import { CURRENT_USER } from '../mock/users';
import { MOCK_CALL_LOGS } from '../mock/calls';
import { MOCK_STATUSES } from '../mock/status';

export type FilterCategory = 'all' | 'unread' | 'favorites' | 'groups';

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
  deleteMessage: (messageId: string) => Promise<void>;
  toggleStarMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  setReplyTo: (reply: ReplyPreview | null) => void;
  togglePin: (id: string) => Promise<void>;
  toggleMute: (id: string) => Promise<void>;
  createNewChat: (contact: User) => Promise<void>;
  createNewGroup: (name: string, members: User[]) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
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
        avatar: su.avatar,
        status: su.status || 'online',
        about: su.about || '',
        phone: su.phone || '',
        email: su.email,
      };
    }
    return { ...CURRENT_USER };
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [theme, setTheme] = useState<ThemeMode>(storage.getTheme());
  const [searchQuery, setSearchQuery] = useState('');
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [replyingToMessage, setReplyingToMessage] = useState<ReplyPreview | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [callLogs] = useState<CallLog[]>(MOCK_CALL_LOGS);
  const [statuses] = useState<StatusItem[]>(MOCK_STATUSES);

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

  // Sync storeUser with currentUser and ensure user-level WebSocket is connected
  useEffect(() => {
    if (storeUser) {
      const updated: User = {
        id: String(storeUser.id),
        name: storeUser.name,
        username: storeUser.username,
        avatar: storeUser.avatar,
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
    (backendMsg: BackendMessagePayload, targetConvId: string): Message => {
      return {
        id: String(backendMsg.id),
        conversationId: targetConvId,
        senderId: String(backendMsg.sender_id),
        text: backendMsg.content,
        timestamp: formatMessageTime(backendMsg.created_at),
        status: 'delivered',
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
    });

    const unsubNewMessage = webSocketService.on<BackendMessagePayload>('NEW_MESSAGE', (payload) => {
      console.log('[ChatContext] Real-time message received:', payload);

      // Deterministic conversation ID for this 1-to-1 pair
      const convId = getDirectConversationId(payload.sender_id, payload.receiver_id);
      const newMsg = mapBackendMessage(payload, convId);

      const myId = String(currentUserRef.current.id);
      const otherId = String(payload.sender_id) === myId ? String(payload.receiver_id) : String(payload.sender_id);

      // 1. Insert/update message in that conversation's message list
      setMessagesMap((prev) => {
        const existingList = prev[convId] || [];

        // Reconcile optimistic message sent by this user
        const optimisticIndex = existingList.findIndex(
          (m) =>
            m.id.startsWith('temp_') &&
            String(m.senderId) === String(payload.sender_id) &&
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

      // 2. Update conversation list and unread counts
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === convId);
        const isCurrentActive = convId === activeConversationIdRef.current;

        if (exists) {
          return prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: newMsg,
                  unreadCount: isCurrentActive ? 0 : (c.unreadCount || 0) + (String(payload.sender_id) !== myId ? 1 : 0),
                  updatedAt: newMsg.createdAt || new Date().toISOString(),
                }
              : c
          );
        }

        // If conversation not yet present in list, dynamically add it
        const newConversation: Conversation = {
          id: convId,
          type: 'direct',
          participantIds: [myId, otherId],
          participants: [
            currentUserRef.current,
            {
              id: otherId,
              name: `User ${otherId}`,
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              status: 'online',
              about: 'Available',
              phone: '',
            },
          ],
          unreadCount: isCurrentActive ? 0 : (String(payload.sender_id) !== myId ? 1 : 0),
          lastMessage: newMsg,
          pinned: false,
          muted: false,
          createdAt: newMsg.createdAt || new Date().toISOString(),
          updatedAt: newMsg.createdAt || new Date().toISOString(),
        };

        return [newConversation, ...prev];
      });
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

    return () => {
      unsubStatus();
      unsubNewMessage();
      unsubHistory();
    };
  }, [mapBackendMessage]);

  // Load registered users and direct conversations from backend
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const activeMyUser = currentUserRef.current;
        const allUsers = await userService.getAllUsers();

        // Build direct conversations from real backend registered users
        const realUsers = allUsers.filter((u) => String(u.id) !== String(activeMyUser.id));

        let initialConversations: Conversation[] = [];

        if (realUsers.length > 0) {
          initialConversations = realUsers.map((user) => ({
            id: getDirectConversationId(activeMyUser.id, user.id),
            type: 'direct',
            participantIds: [String(activeMyUser.id), String(user.id)],
            participants: [activeMyUser, user],
            unreadCount: 0,
            pinned: false,
            muted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        } else {
          const fallbackConvs = await chatService.getConversations();
          initialConversations = fallbackConvs;
        }

        setConversations(initialConversations);

        if (initialConversations.length > 0 && !activeConversationIdRef.current) {
          const firstId = initialConversations[0].id;
          setActiveConversationId(firstId);

          const firstConv = initialConversations[0];
          const targetId = getTargetUserIdFromConversation(activeMyUser.id, firstConv.participantIds);
          if (targetId) {
            webSocketService.fetchHistory(targetId, 1, 50);
          }
        }
      } catch (err) {
        console.error('Failed to load initial chat data:', err);
      }
    };

    loadInitialData();
  }, []);

  // Fetch message history when switching conversations (without reconnecting WebSocket)
  const selectConversation = (id: string | null) => {
    setActiveConversationId(id);
    setReplyingToMessage(null);
    setInChatSearchQuery('');

    if (isMobileView && id) {
      setMobileShowChat(true);
    }

    if (id) {
      chatService.markAsRead(id).then(() => {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
        );
      });

      const conv = conversations.find((c) => c.id === id);
      if (conv && conv.type === 'direct') {
        const targetId = getTargetUserIdFromConversation(currentUser.id, conv.participantIds);
        if (targetId) {
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

    setReplyingToMessage(null);

    // Send through real Django WebSocket
    console.log(`[ChatContext] Sending WebSocket message to receiver ${targetUserId}:`, trimmed);
    const sent = webSocketService.sendMessage(targetUserId, trimmed);
    if (!sent) {
      console.error('[ChatContext] Failed to dispatch message via WebSocket: Socket not connected.');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeConversationId) return;
    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
        m.id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted' } : m
      ),
    }));
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

  const togglePin = async (id: string) => {
    await chatService.togglePinConversation(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const toggleMute = async (id: string) => {
    await chatService.toggleMuteConversation(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c))
    );
  };

  const createNewChat = async (contact: User) => {
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
        deleteMessage,
        toggleStarMessage,
        addReaction,
        setReplyTo: setReplyingToMessage,
        togglePin,
        toggleMute,
        createNewChat,
        createNewGroup,
        updateUserProfile,
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
