import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExtractionResult, ExtractedEntry } from "./memory-extraction";

export async function applyMemoryExtraction({
  supabase,
  babyId,
  conversationId,
  extraction,
}: {
  supabase: SupabaseClient;
  babyId: string;
  conversationId: string;
  extraction: ExtractionResult;
}) {
  // 1. Update conversation summary
  await supabase
    .from("conversations")
    .update({ summary: extraction.summary })
    .eq("id", conversationId);

  if (extraction.entries.length === 0) return;

  // 2. Load existing knowledge entries for matching
  const { data: existing } = await supabase
    .from("knowledge_entries")
    .select("*")
    .eq("baby_id", babyId);

  const existingEntries = existing ?? [];

  for (const entry of extraction.entries) {
    switch (entry.action) {
      case "create":
        await handleCreate(supabase, babyId, conversationId, entry);
        break;
      case "update":
        await handleUpdate(
          supabase,
          babyId,
          conversationId,
          entry,
          existingEntries
        );
        break;
      case "delete":
        await handleDelete(supabase, babyId, entry, existingEntries);
        break;
    }
  }
}

async function handleCreate(
  supabase: SupabaseClient,
  babyId: string,
  conversationId: string,
  entry: ExtractedEntry
) {
  await supabase.from("knowledge_entries").insert({
    baby_id: babyId,
    category: entry.category,
    content: entry.content,
    date_referenced: entry.date_referenced,
    source_conversation_id: conversationId,
  });
}

async function handleUpdate(
  supabase: SupabaseClient,
  babyId: string,
  conversationId: string,
  entry: ExtractedEntry,
  existingEntries: Array<{ id: string; content: string; category: string }>
) {
  // Find the best matching existing entry
  const match = findBestMatch(entry, existingEntries);

  if (match) {
    // Update the existing entry
    await supabase
      .from("knowledge_entries")
      .update({
        content: entry.content,
        date_referenced: entry.date_referenced,
        category: entry.category,
        source_conversation_id: conversationId,
      })
      .eq("id", match.id);
  } else {
    // No match found — create as new
    await handleCreate(supabase, babyId, conversationId, entry);
  }
}

async function handleDelete(
  supabase: SupabaseClient,
  babyId: string,
  entry: ExtractedEntry,
  existingEntries: Array<{ id: string; content: string; category: string }>
) {
  const match = findBestMatch(entry, existingEntries);
  if (match) {
    await supabase
      .from("knowledge_entries")
      .delete()
      .eq("id", match.id)
      .eq("baby_id", babyId);
  }
}

/**
 * Finds the best matching existing entry using:
 * 1. match_content substring search (if provided)
 * 2. Same category + content similarity as fallback
 */
function findBestMatch(
  entry: ExtractedEntry,
  existingEntries: Array<{ id: string; content: string; category: string }>
): { id: string } | null {
  // First: try match_content substring
  if (entry.match_content) {
    const matchStr = entry.match_content.toLowerCase();
    const found = existingEntries.find((e) =>
      e.content.toLowerCase().includes(matchStr)
    );
    if (found) return found;
  }

  // Fallback: same category + content overlap
  const sameCat = existingEntries.filter((e) => e.category === entry.category);
  if (sameCat.length === 0) return null;

  // Simple word overlap scoring
  const entryWords = new Set(
    entry.content.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  );
  let bestScore = 0;
  let bestMatch: { id: string } | null = null;

  for (const existing of sameCat) {
    const existingWords = existing.content
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const overlap = existingWords.filter((w) => entryWords.has(w)).length;
    const score = overlap / Math.max(entryWords.size, existingWords.length, 1);

    if (score > bestScore && score > 0.3) {
      bestScore = score;
      bestMatch = existing;
    }
  }

  return bestMatch;
}
