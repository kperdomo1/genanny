"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteConversation } from "@/app/dashboard/conversations/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface ConversationCardProps {
  id: string;
  title: string | null;
  summary: string | null;
  created_at: string;
}

export function ConversationCard({ id, title, summary, created_at }: ConversationCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const date = new Date(created_at);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
      <Link href={`/dashboard/chat/${id}`} className="block p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate">
            {title ?? "Untitled conversation"}
          </h3>
          <span className="shrink-0 text-xs text-gray-400 ml-2">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {summary && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {summary}
          </p>
        )}
      </Link>

      <div className="border-t border-gray-100 px-4 py-2">
        {showConfirm ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Delete this conversation?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <form action={deleteConversation}>
                <input type="hidden" name="conversation_id" value={id} />
                <SubmitButton pendingText="Deleting..." variant="danger" className="!py-1 !px-3 !text-xs !shadow-none">
                  Delete
                </SubmitButton>
              </form>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
