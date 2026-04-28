"use client";

import { useState, useCallback } from "react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/lib/types";

export function ChatView({
  babyId,
  initialConversationId,
  initialMessages,
  currentUserId,
}: {
  babyId: string;
  initialConversationId?: string;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string, imageUrls?: string[]) => {
      setIsLoading(true);
      setStreamingContent("");

      // Store image URLs as JSON array
      const imageUrlValue =
        imageUrls && imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;

      // Optimistically add user message
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId ?? "",
        role: "user",
        content,
        image_url: imageUrlValue,
        user_id: currentUserId,
        created_at: new Date().toISOString(),
        sender: null,
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            babyId,
            message: content,
            imageUrls,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to send message");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullText = "";
        let newConvId = conversationId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.conversationId && !newConvId) {
                newConvId = data.conversationId;
                setConversationId(newConvId);
                // Update URL without reload
                window.history.replaceState(
                  null,
                  "",
                  `/dashboard/chat/${newConvId}?baby=${babyId}`
                );
              }

              if (data.text) {
                fullText += data.text;
                setStreamingContent(fullText);
              }

              if (data.done) {
                // Add the complete assistant message
                const assistantMessage: Message = {
                  id: `msg-${Date.now()}`,
                  conversation_id: newConvId ?? "",
                  role: "assistant",
                  content: fullText,
                  image_url: null,
                  user_id: null,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent(null);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        // Add error as assistant message
        const errorMsg: Message = {
          id: `err-${Date.now()}`,
          conversation_id: conversationId ?? "",
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          image_url: null,
          user_id: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setStreamingContent(null);
      } finally {
        setIsLoading(false);
      }
    },
    [babyId, conversationId]
  );

  return (
    <div className="flex flex-1 flex-col">
      <ChatMessages messages={messages} streamingContent={streamingContent} currentUserId={currentUserId} />
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
