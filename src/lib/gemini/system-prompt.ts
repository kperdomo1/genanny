import type { Baby, KnowledgeEntry, Conversation } from "@/lib/types";

function formatAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  const dayDiff = now.getDate() - birth.getDate();
  if (dayDiff < 0) months--;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""} and ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
  }
  return `${months} month${months !== 1 ? "s" : ""}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatGender(gender: string | null): string {
  if (!gender || gender === "other") return "Not specified";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

const CATEGORY_LABELS: Record<string, string> = {
  milestone: "Developmental Milestones",
  sleep: "Sleep Patterns",
  illness: "Health & Illness",
  temperament: "Temperament & Behavior",
  feeding: "Feeding & Nutrition",
  trip: "Trips & Travel",
  medical: "Medical History",
  general: "General Notes",
};

function formatKnowledgeEntries(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return "No knowledge entries yet.";

  const grouped = entries.reduce(
    (acc, entry) => {
      const cat = entry.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(entry);
      return acc;
    },
    {} as Record<string, KnowledgeEntry[]>
  );

  const sections: string[] = [];
  for (const [category, items] of Object.entries(grouped)) {
    const label = CATEGORY_LABELS[category] ?? category;
    const lines = items.map((e) => {
      const dateStr = e.date_referenced
        ? ` (${formatDate(e.date_referenced)})`
        : "";
      return `  - ${e.content}${dateStr}`;
    });
    sections.push(`${label}:\n${lines.join("\n")}`);
  }

  return sections.join("\n\n");
}

function formatConversationSummaries(conversations: Conversation[]): string {
  if (conversations.length === 0) return "No previous conversations.";

  return conversations
    .map((c) => {
      const date = formatDate(c.created_at);
      const title = c.title ?? "Untitled conversation";
      const summary = c.summary ?? "No summary available.";
      return `[${date}] ${title}\n  ${summary}`;
    })
    .join("\n\n");
}

export function buildSystemPrompt({
  baby,
  knowledgeEntries,
  recentConversations,
}: {
  baby: Baby;
  knowledgeEntries: KnowledgeEntry[];
  recentConversations: Conversation[];
}): string {
  const today = formatDate(new Date().toISOString());
  const age = formatAge(baby.date_of_birth);
  const dob = formatDate(baby.date_of_birth);

  return `You are Genanny, a knowledgeable, warm, and caring 24/7 pediatric advisor. You provide evidence-based guidance to parents about their baby's health, development, sleep, feeding, and daily care.

TODAY'S DATE: ${today}

BABY PROFILE:
- Name: ${baby.name}
- Date of Birth: ${dob} (Age: ${age})
- Gender: ${formatGender(baby.gender)}
${baby.notes ? `- Parent's Notes: ${baby.notes}` : ""}

KNOWLEDGE BASE (what you know about ${baby.name}):
${formatKnowledgeEntries(knowledgeEntries)}

RECENT CONVERSATION SUMMARIES:
${formatConversationSummaries(recentConversations)}

IMPORTANT INSTRUCTIONS:
- Always reference dates absolutely (e.g., "on March 15, 2025"), never relatively (e.g., "2 weeks ago"). This ensures accuracy across conversations.
- When the parent corrects a previous fact you know about, acknowledge the correction gracefully.
- Be warm, empathetic, and reassuring while remaining evidence-based.
- For age-specific advice, always calculate based on ${baby.name}'s actual age (${age} as of today).
- You are NOT a replacement for professional medical advice. For any serious health concerns, symptoms of emergency, or when you are uncertain, always recommend consulting their pediatrician or seeking immediate medical attention.
- Keep responses concise and mobile-friendly — parents are often reading on their phone while holding a baby.
- When discussing developmental milestones, always note that every baby develops at their own pace and ranges are normal.`;
}
