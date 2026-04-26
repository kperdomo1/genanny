import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { KnowledgeEntry } from "@/lib/types";

const CATEGORY_META: Record<
  string,
  { label: string; emoji: string }
> = {
  milestone: { label: "Milestones", emoji: "🏆" },
  sleep: { label: "Sleep", emoji: "😴" },
  illness: { label: "Health & Illness", emoji: "🤒" },
  temperament: { label: "Temperament", emoji: "😊" },
  feeding: { label: "Feeding", emoji: "🍼" },
  trip: { label: "Trips", emoji: "✈️" },
  medical: { label: "Medical", emoji: "🏥" },
  general: { label: "General", emoji: "📝" },
};

export default async function MemoryPage({
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

  const { data: babies } = await supabase
    .from("babies")
    .select("id, name")
    .order("created_at", { ascending: true });

  const selectedBabyId = babyId ?? babies?.[0]?.id;

  let entries: KnowledgeEntry[] = [];
  if (selectedBabyId) {
    const { data } = await supabase
      .from("knowledge_entries")
      .select("*")
      .eq("baby_id", selectedBabyId)
      .order("updated_at", { ascending: false });
    entries = (data as KnowledgeEntry[]) ?? [];
  }

  // Group by category
  const grouped = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.category]) acc[entry.category] = [];
      acc[entry.category].push(entry);
      return acc;
    },
    {} as Record<string, KnowledgeEntry[]>
  );

  const babyName = babies?.find((b) => b.id === selectedBabyId)?.name;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Memory
        </h1>
        <Link
          href="/dashboard"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Back
        </Link>
      </div>

      <p className="mt-1 text-sm text-gray-500">
        What Genanny remembers about {babyName ?? "your baby"} from your
        conversations.
      </p>

      {/* Baby filter tabs */}
      {babies && babies.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {babies.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/memory?baby=${b.id}`}
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

      {entries.length === 0 ? (
        <div className="mt-12 text-center">
          <div className="text-3xl">🧠</div>
          <p className="mt-3 text-sm text-gray-500">
            No memories yet. Start a conversation and Genanny will automatically
            remember key facts!
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([category, items]) => {
            const meta = CATEGORY_META[category] ?? {
              label: category,
              emoji: "📌",
            };
            return (
              <div key={category}>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>{meta.emoji}</span>
                  {meta.label}
                  <span className="text-xs font-normal text-gray-400">
                    ({items.length})
                  </span>
                </h2>
                <div className="mt-2 space-y-2">
                  {items.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <p className="text-sm text-gray-800">{entry.content}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                        {entry.date_referenced && (
                          <span>
                            {new Date(
                              entry.date_referenced
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        <span>
                          Updated{" "}
                          {new Date(entry.updated_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
