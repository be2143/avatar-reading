"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { useChatBot } from './ChatBotProvider';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBot = () => {
  const {
    isOpen,
    isMinimized,
    messages,
    isLoading,
    openChat,
    closeChat,
    toggleMinimize,
    clearMessages,
    sendMessage: sendMessageToAPI
  } = useChatBot();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const messageToSend = inputMessage;
    setInputMessage('');
    await sendMessageToAPI(messageToSend);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    clearMessages();
  };

  // Animation variants
  const chatButtonVariants = {
    hidden: { 
      scale: 0,
      opacity: 0,
      rotate: -180
    },
    visible: { 
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.9
    }
  };

  const chatWindowVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      x: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      x: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const messageVariants = {
    hidden: (isUser) => ({
      opacity: 0,
      x: isUser ? 50 : -50,
      scale: 0.8
    }),
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const loadingDotsVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-button"
            variants={chatButtonVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            whileHover="hover"
            whileTap="tap"
            onClick={openChat}
            className="fixed bottom-12 right-12 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl"
            aria-label="Open chat"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            variants={chatWindowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
              isMinimized 
                ? 'w-80 h-16 bottom-6 right-6' 
                : isExpanded 
                  ? 'w-[600px] h-[700px] bottom-6 right-6'
                  : 'w-96 h-[500px] bottom-6 right-6'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot size={20} />
                <span className="font-semibold">AI Assistant</span>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleExpand}
                  className="text-white p-1 rounded hover:bg-white/20 transition-colors"
                  aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeChat}
                  className="text-white p-1 rounded hover:bg-white/20 transition-colors"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </motion.button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-300 ${
                  isExpanded ? 'h-[550px]' : 'h-[350px]'
                }`}>
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        custom={message.sender === 'user'}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {message.sender === 'bot' && (
                              <Bot size={16} className="mt-1 flex-shrink-0" />
                            )}
                            {message.sender === 'user' && (
                              <User size={16} className="mt-1 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs opacity-70">
                                  {message.timestamp.toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[80%]">
                        <div className="flex items-center space-x-2">
                          <Bot size={16} />
                          <motion.div
                            variants={loadingDotsVariants}
                            initial="animate"
                            animate="animate"
                            className="flex space-x-1"
                          >
                            <motion.div
                              variants={dotVariants}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                              variants={dotVariants}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                              variants={dotVariants}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="border-t border-gray-200 p-4"
                >
                  <div className="flex space-x-2">
                    <motion.textarea
                      whileFocus={{ scale: 1.02 }}
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={1}
                      disabled={isLoading}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                      aria-label="Send message"
                    >
                      <Send size={16} />
                    </motion.button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearChat}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear chat
                    </motion.button>
                    <span className="text-xs text-gray-400">
                      Powered by GPT-4o
                    </span>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;