"use client";

import ReactMarkdown from "react-markdown";
import type { Message } from "@/lib/types";

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSenderName(
  message: Pick<Message, "role" | "user_id" | "sender">,
  currentUserId: string
): string | null {
  if (message.role === "assistant") return "Genanny";
  if (!message.user_id) return null;
  if (message.user_id === currentUserId) return "You";
  return message.sender?.display_name ?? "Partner";
}

export function MessageBubble({
  message,
  isStreaming,
  currentUserId,
}: {
  message: Pick<Message, "role" | "content" | "image_url" | "user_id" | "created_at"> & {
    sender?: { display_name: string | null } | null;
  };
  isStreaming?: boolean;
  currentUserId: string;
}) {
  const isUser = message.role === "user";
  const senderName = getSenderName(message, currentUserId);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Sender name + timestamp */}
        {senderName && (
          <div
            className={`flex items-center gap-1.5 mb-0.5 px-1 ${
              isUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span className="text-[11px] font-medium text-gray-500">
              {senderName}
            </span>
            {!isStreaming && message.created_at && (
              <span className="text-[10px] text-gray-400">
                {formatTime(message.created_at)}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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
    </div>
  );
}
