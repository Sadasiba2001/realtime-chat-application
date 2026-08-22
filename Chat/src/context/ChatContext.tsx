/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { userService } from '../services/user.service';
import { chatService } from '../services/chat.service';
import { messageService } from '../services/message.service';
import { MOCK_CALL_LOGS } from '../mock/calls';
import { MOCK_STATUSES } from '../mock/status';
import { storage } from '../utils/storage.utils';

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
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user_me',
    name: 'Barsha Barik',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    about: 'Available | Standard response time < 5 mins 🚀',
    phone: '+91 98765 43210',
    email: 'barsha@example.com',
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv_rahul');
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [theme, setTheme] = useState<ThemeMode>(() => storage.getTheme());
  const [searchQuery, setSearchQuery] = useState('');
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [replyingToMessage, setReplyingToMessage] = useState<ReplyPreview | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [callLogs] = useState<CallLog[]>(MOCK_CALL_LOGS);
  const [statuses] = useState<StatusItem[]>(MOCK_STATUSES);

  // Responsive & Modal state
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<unknown>(null);

  // Initialize Theme and data
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      const user = await userService.getCurrentUser();
      setCurrentUser(user);

      const convs = await chatService.getConversations();
      setConversations(convs);

      if (convs.length > 0) {
        const initialId = convs[0].id;
        const initialMsgs = await messageService.getMessagesByConversationId(initialId);
        setMessagesMap((prev) => ({ ...prev, [initialId]: initialMsgs }));
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeConversationId && !messagesMap[activeConversationId]) {
      messageService.getMessagesByConversationId(activeConversationId).then((msgs) => {
        setMessagesMap((prev) => ({ ...prev, [activeConversationId]: msgs }));
      });
    }
    if (activeConversationId) {
      chatService.markAsRead(activeConversationId).then(() => {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
        );
      });
    }
  }, [activeConversationId, messagesMap]);

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

  const sendMessage = async (text: string, attachments?: Attachment[]) => {
    if (!activeConversationId) return;

    const newMsg = await messageService.sendMessage(
      activeConversationId,
      currentUser.id,
      text,
      attachments,
      replyingToMessage || undefined
    );

    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              lastMessage: newMsg,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    setReplyingToMessage(null);

    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (activeConv && activeConv.type === 'direct') {
      const otherUser = activeConv.participants.find((p) => p.id !== currentUser.id);
      if (otherUser) {
        setTimeout(async () => {
          const replies = [
            "Got it! Thanks for sharing.",
            "Sounds good, I will check it out shortly 👍",
            "Awesome! Let me review this.",
            "Perfect, let's keep moving forward!",
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const mockIncoming = await messageService.sendMessage(
            activeConversationId,
            otherUser.id,
            randomReply
          );

          setMessagesMap((prev) => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] || []), mockIncoming],
          }));

          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId
                ? {
                    ...c,
                    lastMessage: mockIncoming,
                    updatedAt: new Date().toISOString(),
                  }
                : c
            )
          );
        }, 2500);
      }
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
