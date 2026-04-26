"use client";

import ReactMarkdown from "react-markdown";
import type { Message } from "@/lib/types";

export function MessageBubble({
  message,
  isStreaming,
}: {
  message: Pick<Message, "role" | "content" | "image_url">;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        }`}
      >
        {message.image_url && (
          <img
            src={message.image_url}
            alt="Attached image"
            className="mb-2 max-h-48 rounded-lg object-cover"
          />
        )}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          <div className="prose-chat break-words">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-400 animate-pulse rounded-sm align-text-bottom" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
