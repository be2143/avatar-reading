"use client";
import { useState, useEffect } from "react";
import SideBar from "../components/SideBar";

export default function ChatbotPage() {
  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("chatMessages");
      return stored
        ? JSON.parse(stored)
        : [
            {
              role: "assistant",
              content:
                "Hi! I am your AI assistant on this site designed for kids with autism. I can help with AAC tools, routine organizers, and more. How can I help you today?",
            },
          ];
    }
    return [
      {
        role: "assistant",
        content: "Hi! How can I help you today?",
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const initialMsg = [
      {
        role: "assistant",
        content: "Welcome back! How can I help you today?",
      },
    ];
    setMessages(initialMsg);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("chatMessages", JSON.stringify(initialMsg));
    }
  };

  return (
    // Example styling for the chat container
    <div className="min-h-screen bg-[#F5F0FF] flex justify-center">
      {/* Main chat container with limited width */}
      <SideBar />
      <div className="w-[800px] flex flex-col bg-white rounded-3xl shadow-lg m-6">
        {/* Header */}
        <div className="p-6 border-b border-purple-100">
          <h1 className="text-3xl font-bold text-[#8A2BE2] text-center">
            Chat with Me!
          </h1>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-4 rounded-2xl max-w-[75%] ${
                msg.role === "user"
                  ? "bg-[#8A2BE2] text-white ml-auto"
                  : "bg-[#FFD4B8] text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-6 border-t border-purple-100">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-4 rounded-full bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 bg-[#8A2BE2] text-white rounded-full hover:bg-opacity-90 disabled:bg-opacity-50"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
