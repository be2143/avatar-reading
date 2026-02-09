"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ChatBot from "./ChatBot";

const ChatBotEntry = () => {
  const pathname = usePathname();

  // Hide chatbot on login and signup pages
  if (pathname === "/" || pathname.startsWith("/register")) {
    return null;
  }

  return <ChatBot />;
};

export default ChatBotEntry;





