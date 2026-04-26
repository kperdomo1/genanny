import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ChatView } from "@/components/chat/ChatView";
import type { Message } from "@/lib/types";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load conversation (RLS handles ownership + partner sharing)
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  // Load messages with sender info
  const { data: messages } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_user_id_fkey(display_name)")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <ChatView
      babyId={conversation.baby_id}
      initialConversationId={conversation.id}
      initialMessages={(messages as Message[]) ?? []}
      currentUserId={user.id}
    />
  );
}
