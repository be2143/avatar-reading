"use client";
import { useState, useEffect } from "react";
export default function ChatbotPage() {
  const [isExpanded, setIsExpanded] = useState(false);
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

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#8A2BE2] rounded-full shadow-lg flex items-center justify-center hover:bg-opacity-90 transition-all z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[500px] bg-white rounded-3xl shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-[#8A2BE2] text-xl font-semibold">Chat with Me!</h2>
        <button
          onClick={() => setIsExpanded(false)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F0FF]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A2BE2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Messages Container - with fixed height */}
      <div className="flex-1 overflow-y-auto bg-[#F5F0FF]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`m-4 p-4 rounded-2xl max-w-[75%] ${
              msg.role === "user"
                ? "bg-[#8A2BE2] text-white ml-auto"
                : "bg-[#FFD4B8] text-gray-800"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input Form - fixed at bottom */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 rounded-full bg-white border border-gray-200 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-[#8A2BE2] text-white rounded-full hover:bg-opacity-90 disabled:bg-opacity-50"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
