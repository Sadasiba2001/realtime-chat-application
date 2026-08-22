import React, { useEffect } from 'react';
import { ChatPage } from './ChatPage';
import { useChat } from '../context/ChatContext';

export const StatusPage: React.FC = () => {
  const { setActiveTab } = useChat();

  useEffect(() => {
    setActiveTab('status');
  }, [setActiveTab]);

  return <ChatPage />;
};
