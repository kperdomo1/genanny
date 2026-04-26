import { getGeminiClient, GEMINI_MODEL } from "./client";
import type { Message, KnowledgeEntry } from "@/lib/types";

export interface ExtractionResult {
  summary: string;
  entries: ExtractedEntry[];
}

export interface ExtractedEntry {
  action: "create" | "update" | "delete";
  category: KnowledgeEntry["category"];
  content: string;
  date_referenced: string | null;
  /** For update/delete: substring match against existing entry content */
  match_content?: string;
}

const VALID_CATEGORIES = [
  "milestone",
  "sleep",
  "illness",
  "temperament",
  "feeding",
  "trip",
  "medical",
  "general",
];

function buildExtractionPrompt(
  babyName: string,
  babyDob: string,
  today: string
): string {
  return `You are a memory extraction system for a pediatric advisor app. Analyze the conversation about baby ${babyName} (born ${babyDob}) and extract two things:

1. SUMMARY: A concise 2-3 sentence summary of the entire conversation so far. Focus on what was discussed and any advice given.

2. KNOWLEDGE ENTRIES: Extract any new, updated, or corrected facts about the baby. For each fact:
   - action: "create" (new fact), "update" (corrects/replaces an existing fact), or "delete" (removes an outdated fact)
   - category: one of [milestone, sleep, illness, temperament, feeding, trip, medical, general]
   - content: the fact stated clearly with absolute dates (today is ${today})
   - date_referenced: the date this fact refers to in YYYY-MM-DD format, or null if no specific date
   - match_content: (only for "update" or "delete") a substring that identifies the existing entry to update/delete

IMPORTANT RULES:
- Convert ALL relative dates to absolute dates. If the parent says "yesterday", calculate the actual date based on today (${today}).
- Only extract genuinely new or changed information. Do not re-extract facts that would already be known.
- For corrections (e.g., "actually she started crawling on March 5th, not March 1st"), use action "update" with match_content pointing to the old fact.
- Be conservative — only extract clear, factual information, not speculative advice.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "summary": "...",
  "entries": [
    {
      "action": "create",
      "category": "milestone",
      "content": "Started crawling on 2025-03-05",
      "date_referenced": "2025-03-05",
      "match_content": null
    }
  ]
}

If there are no new knowledge entries to extract, return an empty entries array.`;
}

function formatMessagesForExtraction(messages: Message[]): string {
  return messages
    .map((m) => {
      const role = m.role === "user" ? "Parent" : "Genanny";
      return `${role}: ${m.content}`;
    })
    .join("\n\n");
}

export async function extractMemory({
  messages,
  babyName,
  babyDob,
}: {
  messages: Message[];
  babyName: string;
  babyDob: string;
}): Promise<ExtractionResult | null> {
  if (messages.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];
  const systemPrompt = buildExtractionPrompt(babyName, babyDob, today);
  const conversationText = formatMessagesForExtraction(messages);

  const ai = getGeminiClient();

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
      },
      contents: `Here is the conversation to analyze:\n\n${conversationText}`,
    });

    const text = response.text?.trim();
    if (!text) return null;

    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as ExtractionResult;

    // Validate and sanitize
    if (!parsed.summary || typeof parsed.summary !== "string") return null;

    parsed.entries = (parsed.entries ?? []).filter(
      (e) =>
        ["create", "update", "delete"].includes(e.action) &&
        VALID_CATEGORIES.includes(e.category) &&
        typeof e.content === "string" &&
        e.content.length > 0
    );

    return parsed;
  } catch (err) {
    console.error("Memory extraction failed:", err);
    return null;
  }
}
