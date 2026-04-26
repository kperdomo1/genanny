import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatView } from "@/components/chat/ChatView";

export default async function NewChatPage({
  searchParams,
}: {
  searchParams: Promise<{ baby?: string }>;
}) {
  const { baby: babyId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If no baby selected, get the first one
  let selectedBabyId = babyId;
  if (!selectedBabyId) {
    const { data: babies } = await supabase
      .from("babies")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1);

    if (!babies || babies.length === 0) {
      redirect("/dashboard/babies");
    }
    selectedBabyId = babies[0].id;
  }

  // Verify baby is accessible (RLS handles ownership + partner sharing)
  const { data: baby } = await supabase
    .from("babies")
    .select("id")
    .eq("id", selectedBabyId)
    .single();

  if (!baby) redirect("/dashboard/babies");

  return <ChatView babyId={baby.id} initialMessages={[]} />;
}
