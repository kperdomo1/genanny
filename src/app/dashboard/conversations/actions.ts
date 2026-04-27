"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function deleteConversation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const conversationId = formData.get("conversation_id") as string;

  // Nullify source_conversation_id on linked knowledge entries
  // (don't delete the knowledge — it's still valid, just unlinked)
  await supabase
    .from("knowledge_entries")
    .update({ source_conversation_id: null })
    .eq("source_conversation_id", conversationId);

  // Delete conversation (messages cascade via FK)
  await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  redirect("/dashboard/conversations");
}
