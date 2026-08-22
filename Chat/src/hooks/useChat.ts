import { useChat as useChatFromContext } from '../context/ChatContext';

export const useChat = () => {
  return useChatFromContext();
};
