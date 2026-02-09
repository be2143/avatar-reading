"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const ChatBotContext = createContext();

export const useChatBot = () => {
  const context = useContext(ChatBotContext);
  if (!context) {
    throw new Error('useChatBot must be used within a ChatBotProvider');
  }
  return context;
};

export const ChatBotProvider = ({ children }) => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  }, []);

  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    addMessage(userMessage);
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: conversationHistory,
          userId: session?.user?.id || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        };
        addMessage(botMessage);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          text: `Sorry, I encountered an error: ${data.error || 'Please try again later.'}`,
          sender: 'bot',
          timestamp: new Date()
        };
        addMessage(errorMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered a network error. Please check your connection and try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, addMessage, session]);

  const value = {
    isOpen,
    isMinimized,
    messages,
    isLoading,
    openChat,
    closeChat,
    toggleMinimize,
    addMessage,
    clearMessages,
    sendMessage,
    setIsOpen,
    setIsMinimized,
    setMessages,
    setIsLoading
  };

  return (
    <ChatBotContext.Provider value={value}>
      {children}
    </ChatBotContext.Provider>
  );
};
