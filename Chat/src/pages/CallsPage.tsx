import React, { useEffect } from 'react';
import { ChatPage } from './ChatPage';
import { useChat } from '../context/ChatContext';

export const CallsPage: React.FC = () => {
  const { setActiveTab } = useChat();

  useEffect(() => {
    setActiveTab('calls');
  }, [setActiveTab]);

  return <ChatPage />;
};
