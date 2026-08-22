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
  BackendHistoryData,
  BackendMessagePayload,
  WSSocketStatus,
} from '../types/websocket.types';
import { userService } from '../services/user.service';
import { chatService } from '../services/chat.service';
import { messageService } from '../services/message.service';
import { webSocketService } from '../services/websocket.service';
import { storage } from '../utils/storage.utils';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime } from '../utils/date.utils';
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

  // Sync storeUser with currentUser
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

  // Helper to resolve conversation ID from sender and receiver IDs
  const resolveConversationIdForUsers = useCallback(
    (senderId: string | number, receiverId: string | number): string => {
      const sId = String(senderId);
      const rId = String(receiverId);
      const myId = String(currentUserRef.current.id);

      const targetOtherId = sId === myId ? rId : sId;

      // Find direct conversation matching targetOtherId
      const found = conversationsRef.current.find(
        (c) => c.type === 'direct' && c.participantIds.some((pId) => String(pId) === targetOtherId)
      );

      if (found) return found.id;
      return `conv_${targetOtherId}`;
    },
    []
  );

  // Set up WebSocket global listeners
  useEffect(() => {
    const unsubStatus = webSocketService.on<WSSocketStatus>('SOCKET_STATUS', (status) => {
      console.log('[ChatContext] Socket status changed to:', status);
      setSocketStatus(status);
    });

    const unsubNewMessage = webSocketService.on<BackendMessagePayload>('NEW_MESSAGE', (payload) => {
      console.log('[ChatContext] Real-time NEW_MESSAGE received:', payload);
      const convId = resolveConversationIdForUsers(payload.sender_id, payload.receiver_id);
      const newMsg = mapBackendMessage(payload, convId);

      const myId = String(currentUserRef.current.id);
      const otherId = String(payload.sender_id) === myId ? String(payload.receiver_id) : String(payload.sender_id);

      setMessagesMap((prev) => {
        const existingList = prev[convId] || [];
        // Replace temporary optimistic message if matching text and sender
        const optimisticIndex = existingList.findIndex(
          (m) => m.id.startsWith('temp_') && m.senderId === String(payload.sender_id) && m.text === payload.content
        );

        if (optimisticIndex > -1) {
          const updated = [...existingList];
          updated[optimisticIndex] = newMsg;
          return { ...prev, [convId]: updated };
        }

        // Prevent duplicate IDs
        if (existingList.some((m) => m.id === newMsg.id)) {
          return prev;
        }

        return {
          ...prev,
          [convId]: [...existingList, newMsg],
        };
      });

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === convId);
        if (exists) {
          return prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: newMsg,
                  updatedAt: newMsg.createdAt || new Date().toISOString(),
                }
              : c
          );
        }

        // Dynamically add new conversation to sidebar on incoming message
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
          unreadCount: convId === activeConversationIdRef.current ? 0 : 1,
          lastMessage: newMsg,
          pinned: false,
          muted: false,
          createdAt: newMsg.createdAt || new Date().toISOString(),
          updatedAt: newMsg.createdAt || new Date().toISOString(),
        };

        return [newConversation, ...prev];
      });
    });

    const unsubHistory = webSocketService.on<BackendHistoryData>('HISTORY_LOADED', (payload) => {
      console.log('[ChatContext] HISTORY_LOADED received:', payload);
      setIsLoadingHistory(false);
      const activeId = activeConversationIdRef.current;
      if (!activeId) return;

      const results = payload.results || [];
      const formattedMsgs = results.map((item) => mapBackendMessage(item, activeId));

      setMessagesMap((prev) => {
        const existing = prev[activeId] || [];
        const page = payload.page || 1;

        if (page === 1) {
          const existingById = new Map(existing.map((m) => [m.id, m]));
          formattedMsgs.forEach((m) => existingById.set(m.id, m));
          const merged = Array.from(existingById.values()).sort(
            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          );
          return { ...prev, [activeId]: merged };
        } else {
          const existingIds = new Set(existing.map((m) => m.id));
          const olderUnique = formattedMsgs.filter((m) => !existingIds.has(m.id));
          const merged = [...olderUnique, ...existing].sort(
            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          );
          return { ...prev, [activeId]: merged };
        }
      });

      setHistoryPages((prev) => ({ ...prev, [activeId]: payload.page || 1 }));
      setHasMoreHistoryMap((prev) => ({
        ...prev,
        [activeId]: (payload.page || 1) * (payload.page_size || 50) < payload.count,
      }));

      // Update last message in conversation list
      if (formattedMsgs.length > 0) {
        const latest = formattedMsgs[formattedMsgs.length - 1];
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, lastMessage: latest } : c))
        );
      }
    });

    return () => {
      unsubStatus();
      unsubNewMessage();
      unsubHistory();
    };
  }, [mapBackendMessage, resolveConversationIdForUsers]);

  // Load initial user & conversations from backend
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
            id: `conv_${user.id}`,
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
          setActiveConversationId(initialConversations[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial chat data:', err);
      }
    };

    loadInitialData();
  }, []);

  // Connect WebSocket whenever activeConversation changes
  useEffect(() => {
    if (!activeConversationId) {
      webSocketService.disconnect();
      return;
    }

    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    if (conv.type === 'direct') {
      const otherUser = conv.participants.find((p) => String(p.id) !== String(currentUser.id));
      const targetUserId = otherUser ? otherUser.id : conv.participantIds.find((id) => String(id) !== String(currentUser.id));
      const token = storage.getAuthToken();

      if (targetUserId && token) {
        let cleanTargetId: string | number = targetUserId;
        const numMatch = String(targetUserId).match(/\d+/);
        if (numMatch) {
          cleanTargetId = numMatch[0];
        }

        console.log(`[ChatContext] Connecting WebSocket to target user: ${cleanTargetId}`);
        webSocketService.connect(cleanTargetId, token);

        // Fetch conversation history via WebSocket
        setTimeout(() => {
          webSocketService.fetchHistory(1, 50);
        }, 150);
      }
    } else {
      webSocketService.disconnect();
    }

    // Mark as read
    chatService.markAsRead(activeConversationId).then(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
      );
    });
  }, [activeConversationId, conversations, currentUser.id]);

  const selectConversation = (id: string | null) => {
    setActiveConversationId(id);
    setReplyingToMessage(null);
    setInChatSearchQuery('');
    if (isMobileView && id) {
      setMobileShowChat(true);
    }
  };

  const backToChatListMobile = () => {
    setMobileShowChat(false);
  };

  const loadMoreHistory = async () => {
    if (!activeConversationId || isLoadingHistory) return;

    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv || conv.type !== 'direct') return;

    const currentPage = historyPages[activeConversationId] || 1;
    const nextPage = currentPage + 1;

    setIsLoadingHistory(true);
    const sent = webSocketService.fetchHistory(nextPage, 50);
    if (!sent) {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async (text: string, attachments?: Attachment[]) => {
    if (!activeConversationId) return;

    const activeConv = conversations.find((c) => c.id === activeConversationId);
    const trimmed = text.trim();
    if (!trimmed && (!attachments || attachments.length === 0)) return;

    const isSocketOpen = webSocketService.isConnected();

    // Optimistic UI message display
    const optimisticMsg: Message = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      conversationId: activeConversationId,
      senderId: String(currentUser.id),
      text: trimmed,
      timestamp: formatMessageTime(new Date().toISOString()),
      status: isSocketOpen ? 'delivered' : 'sent',
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

    // Send over WebSocket if direct chat
    if (activeConv?.type === 'direct' && isSocketOpen && trimmed) {
      console.log('[ChatContext] Dispatching real message via WebSocket:', trimmed);
      webSocketService.sendMessage(trimmed);
      return;
    }

    // Fallback send via MessageService
    if (!isSocketOpen) {
      console.warn('[ChatContext] WebSocket not open. Message saved locally.');
      await messageService.sendMessage(
        activeConversationId,
        currentUser.id,
        trimmed,
        attachments,
        replyingToMessage || undefined
      );
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeConversationId) return;
    await messageService.deleteMessage(activeConversationId, messageId);
    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
        m.id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted' } : m
      ),
    }));
  };

  const toggleStarMessage = async (messageId: string) => {
    if (!activeConversationId) return;
    await messageService.toggleStarMessage(activeConversationId, messageId);
    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
        m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
      ),
    }));
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!activeConversationId) return;
    const updated = await messageService.addReaction(
      activeConversationId,
      messageId,
      emoji,
      currentUser.id,
      currentUser.name
    );
    if (updated) {
      setMessagesMap((prev) => ({
        ...prev,
        [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
          m.id === messageId ? updated : m
        ),
      }));
    }
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
