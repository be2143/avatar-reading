"use client";

import { useChatBot } from './ChatBotProvider';

// Custom hook for easy access to chatbot functionality from any component
export const useChatBotActions = () => {
  const { openChat, sendMessage, clearMessages } = useChatBot();
  
  return {
    openChat,
    sendMessage,
    clearMessages
  };
};

// Utility function to programmatically open chat with a pre-filled message
export const openChatWithMessage = (message) => {
  // This would be used with the context, but since we can't call hooks outside components,
  // we'll provide a component-based solution
  return message;
};

