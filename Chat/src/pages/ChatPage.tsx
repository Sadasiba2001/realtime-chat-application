import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ChatList } from '../components/chat/ChatList';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageArea } from '../components/chat/MessageArea';
import { MessageComposer } from '../components/chat/MessageComposer';
import { InChatSearch } from '../components/chat/InChatSearch';
import { ContactInfoDrawer } from '../components/chat/ContactInfoDrawer';
import { StatusView } from '../components/status/StatusView';
import { CallsView } from '../components/calls/CallsView';
import { SettingsView } from '../components/settings/SettingsView';

export const ChatPage: React.FC = () => {
  const { activeConversation, isMobileView, mobileShowChat, activeTab } = useChat();
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  // In-chat search match navigation
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  return (
    <div className="h-screen w-screen flex p-0 md:p-2.5 lg:p-3 gap-0 md:gap-2.5 lg:gap-3 bg-[#eef2f6] dark:bg-[#0b0f19] overflow-hidden select-none">
      {/* Left Navigation Sidebar Island */}
      {(!isMobileView || !mobileShowChat) && <Sidebar />}

      {/* Conditional Active Tab Content */}
      {activeTab === 'status' ? (
        <div className="flex-1 flex overflow-hidden rounded-none md:rounded-2xl border-0 md:border border-slate-200/80 dark:border-white/10 shadow-none md:shadow-2xl bg-white dark:bg-[#111827]">
          <StatusView />
        </div>
      ) : activeTab === 'calls' ? (
        <div className="flex-1 flex overflow-hidden rounded-none md:rounded-2xl border-0 md:border border-slate-200/80 dark:border-white/10 shadow-none md:shadow-2xl bg-white dark:bg-[#111827]">
          <CallsView />
        </div>
      ) : activeTab === 'settings' ? (
        <div className="flex-1 flex overflow-hidden rounded-none md:rounded-2xl border-0 md:border border-slate-200/80 dark:border-white/10 shadow-none md:shadow-2xl bg-white dark:bg-[#111827]">
          <SettingsView />
        </div>
      ) : (
        /* Default 'chats' Tab View */
        <>
          {/* Chat List Island (Desktop always visible, hidden on Mobile when chat active) */}
          {(!isMobileView || !mobileShowChat) && <ChatList />}

          {/* Main Chat Area Island (Mobile shows when chat active, Desktop always visible) */}
          {(!isMobileView || mobileShowChat) && (
            <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#111827] rounded-none md:rounded-2xl border-0 md:border border-slate-200/80 dark:border-white/10 shadow-none md:shadow-2xl relative overflow-hidden">
              {activeConversation ? (
                <>
                  <ChatHeader
                    onToggleSearch={() => setShowInChatSearch(!showInChatSearch)}
                    onToggleInfo={() => setShowContactInfo(!showContactInfo)}
                  />

                  {showInChatSearch && (
                    <InChatSearch
                      onClose={() => setShowInChatSearch(false)}
                      matchCount={0}
                      currentMatchIndex={currentMatchIndex}
                      onNext={() => setCurrentMatchIndex((prev) => prev + 1)}
                      onPrev={() => setCurrentMatchIndex((prev) => Math.max(0, prev - 1))}
                    />
                  )}

                  <div className="flex-1 flex overflow-hidden relative">
                    <div className="flex-1 flex flex-col min-w-0">
                      <MessageArea onToggleSearch={() => setShowInChatSearch(true)} />
                      <MessageComposer />
                    </div>

                    {/* Contact Info Drawer */}
                    {showContactInfo && (
                      <ContactInfoDrawer onClose={() => setShowContactInfo(false)} />
                    )}
                  </div>
                </>
              ) : (
                <MessageArea onToggleSearch={() => { }} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

