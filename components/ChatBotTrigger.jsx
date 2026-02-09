"use client";

import React from 'react';
import { useChatBotActions } from './useChatBotActions';
import { MessageCircle } from 'lucide-react';

// Example component showing how to use the chatbot from any page
const ChatBotTrigger = ({ message, children, className = "" }) => {
  const { openChat, sendMessage } = useChatBotActions();

  const handleClick = () => {
    openChat();
    if (message) {
      // Send a message after opening the chat
      setTimeout(() => {
        sendMessage(message);
      }, 100);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors ${className}`}
    >
      <MessageCircle size={16} />
      <span>{children || 'Ask AI Assistant'}</span>
    </button>
  );
};

export default ChatBotTrigger;

