import React, { useEffect } from 'react';
import { ChatPage } from './ChatPage';
import { useChat } from '../context/ChatContext';

export const SettingsPage: React.FC = () => {
  const { setActiveTab } = useChat();

  useEffect(() => {
    setActiveTab('settings');
  }, [setActiveTab]);

  return <ChatPage />;
};
