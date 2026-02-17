"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ChatBot from "./ChatBot";

const ChatBotEntry = () => {
  const pathname = usePathname();

  // Hide chatbot on login, signup, and avatar-read pages
  if (pathname === "/" || pathname.startsWith("/register") || pathname.includes("/avatar-read")) {
    return null;
  }

  return <ChatBot />;
};

export default ChatBotEntry;





