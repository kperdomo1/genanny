export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface Baby {
  id: string;
  user_id: string;
  name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  baby_id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  image_url: string | null;
  user_id: string | null;
  created_at: string;
  /** Joined from profiles — not always present */
  sender?: { display_name: string | null } | null;
}

export interface KnowledgeEntry {
  id: string;
  baby_id: string;
  category:
    | "milestone"
    | "sleep"
    | "illness"
    | "temperament"
    | "feeding"
    | "trip"
    | "medical"
    | "general";
  content: string;
  date_referenced: string | null;
  source_conversation_id: string | null;
  created_at: string;
  updated_at: string;
}
