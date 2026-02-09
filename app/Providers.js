"use client";

import { SessionProvider } from "next-auth/react";
import { ChatBotProvider } from "../components/ChatBotProvider";

export const AuthProvider = ({ children }) => {
  return (
    <SessionProvider>
      <ChatBotProvider>
        {children}
      </ChatBotProvider>
    </SessionProvider>
  );
};
