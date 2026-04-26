"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/lib/types";

export function ChatMessages({
  messages,
  streamingContent,
}: {
  messages: Message[];
  streamingContent: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.length === 0 && !streamingContent && (
        <div className="flex h-full items-center justify-center text-center">
          <div>
            <div className="text-3xl">👶</div>
            <p className="mt-3 text-sm text-gray-500">
              Ask me anything about your baby!
            </p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {streamingContent !== null && (
        <MessageBubble
          message={{ role: "assistant", content: streamingContent, image_url: null }}
          isStreaming
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
