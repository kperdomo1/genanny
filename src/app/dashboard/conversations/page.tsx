import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ConversationsPage({
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

  // Get babies (RLS handles shared access)
  const { data: babies } = await supabase
    .from("babies")
    .select("id, name")
    .order("created_at", { ascending: true });

  const selectedBabyId = babyId ?? babies?.[0]?.id;

  // Load conversations for selected baby
  let conversations: Array<{
    id: string;
    title: string | null;
    summary: string | null;
    created_at: string;
    baby_id: string;
  }> = [];

  if (selectedBabyId) {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, summary, created_at, baby_id")
      .eq("baby_id", selectedBabyId)
      .order("created_at", { ascending: false });
    conversations = data ?? [];
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Conversations</h1>
        <Link
          href={`/dashboard/chat${selectedBabyId ? `?baby=${selectedBabyId}` : ""}`}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          New chat
        </Link>
      </div>

      {/* Baby filter tabs */}
      {babies && babies.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {babies.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/conversations?baby=${b.id}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                b.id === selectedBabyId
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">No conversations yet.</p>
          <Link
            href={`/dashboard/chat${selectedBabyId ? `?baby=${selectedBabyId}` : ""}`}
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Start your first conversation
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {conversations.map((conv) => {
            const date = new Date(conv.created_at);
            return (
              <Link
                key={conv.id}
                href={`/dashboard/chat/${conv.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conv.title ?? "Untitled conversation"}
                  </h3>
                  <span className="shrink-0 text-xs text-gray-400 ml-2">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {conv.summary && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {conv.summary}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
