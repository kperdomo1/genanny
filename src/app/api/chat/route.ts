import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini/client";
import { buildSystemPrompt } from "@/lib/gemini/system-prompt";
import { extractMemory } from "@/lib/gemini/memory-extraction";
import { applyMemoryExtraction } from "@/lib/gemini/apply-memory";
import type { Message, KnowledgeEntry, Conversation, Baby } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    conversationId,
    babyId,
    message,
    imageUrl,
  }: {
    conversationId?: string;
    babyId: string;
    message: string;
    imageUrl?: string;
  } = body;

  // Verify baby is accessible (RLS handles ownership + partner sharing)
  const { data: baby } = await supabase
    .from("babies")
    .select("*")
    .eq("id", babyId)
    .single();

  if (!baby) {
    return Response.json({ error: "Baby not found" }, { status: 404 });
  }

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({
        baby_id: babyId,
        user_id: user.id,
        title: message.slice(0, 100),
      })
      .select()
      .single();

    if (error || !conv) {
      return Response.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }
    convId = conv.id;
  }

  // Save user message
  await supabase.from("messages").insert({
    conversation_id: convId,
    role: "user",
    content: message,
    image_url: imageUrl ?? null,
    user_id: user.id,
  });

  // Load conversation history
  const { data: history } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true });

  // Load knowledge entries for this baby
  const { data: knowledgeEntries } = await supabase
    .from("knowledge_entries")
    .select("*")
    .eq("baby_id", babyId)
    .order("date_referenced", { ascending: false });

  // Load recent conversation summaries (last 5, excluding current)
  const { data: recentConversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("baby_id", babyId)
    .neq("id", convId)
    .not("summary", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  // Build system prompt
  const systemPrompt = buildSystemPrompt({
    baby: baby as Baby,
    knowledgeEntries: (knowledgeEntries as KnowledgeEntry[]) ?? [],
    recentConversations: (recentConversations as Conversation[]) ?? [],
  });

  // Build Gemini chat history
  const geminiHistory = ((history as Message[]) ?? [])
    .filter((m) => m.content !== message || m.role !== "user") // exclude the message we just inserted
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }));

  // Build the message parts (text + optional image)
  const messageParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // If image is attached, download and convert to base64
  if (imageUrl) {
    try {
      const imgResponse = await fetch(imageUrl);
      const imgBuffer = await imgResponse.arrayBuffer();
      const base64 = Buffer.from(imgBuffer).toString("base64");
      const mimeType = imgResponse.headers.get("content-type") ?? "image/jpeg";
      messageParts.push({ inlineData: { mimeType, data: base64 } });
    } catch (err) {
      console.error("Failed to fetch image for Gemini:", err);
    }
  }

  messageParts.push({ text: message });

  // Call Gemini with streaming
  const ai = getGeminiClient();
  const chat = ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: systemPrompt,
    },
    history: geminiHistory,
  });

  const stream = await chat.sendMessageStream({ message: messageParts });

  // Create a ReadableStream that forwards Gemini chunks and saves the full response
  let fullResponse = "";
  const encoder = new TextEncoder();
  // Capture convId in a const for the closure — guaranteed defined at this point
  const finalConvId = convId!;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text ?? "";
          if (text) {
            fullResponse += text;
            // Send as SSE-style data
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text, conversationId: finalConvId })}\n\n`
              )
            );
          }
        }

        // Save assistant message to DB
        await supabase.from("messages").insert({
          conversation_id: finalConvId,
          role: "assistant",
          content: fullResponse,
        });

        // Send done event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, conversationId: finalConvId })}\n\n`
          )
        );
        controller.close();

        // Fire memory extraction in background (non-blocking)
        runMemoryExtraction({
          supabase,
          baby: baby as Baby,
          conversationId: finalConvId,
          fullResponse,
          history: (history as Message[]) ?? [],
          userMessage: message,
        }).catch((err) => {
          console.error("Background memory extraction failed:", err);
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Runs memory extraction in the background after streaming completes.
 * This is fire-and-forget — errors are logged but don't affect the user.
 */
async function runMemoryExtraction({
  supabase,
  baby,
  conversationId,
  fullResponse,
  history,
  userMessage,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  baby: Baby;
  conversationId: string;
  fullResponse: string;
  history: Message[];
  userMessage: string;
}) {
  // Build the full message list including the new exchange
  const allMessages: Message[] = [
    ...history,
    {
      id: "temp-user",
      conversation_id: conversationId,
      role: "user",
      content: userMessage,
      image_url: null,
      user_id: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "temp-assistant",
      conversation_id: conversationId,
      role: "assistant",
      content: fullResponse,
      image_url: null,
      user_id: null,
      created_at: new Date().toISOString(),
    },
  ];

  const extraction = await extractMemory({
    messages: allMessages,
    babyName: baby.name,
    babyDob: baby.date_of_birth,
  });

  if (!extraction) return;

  await applyMemoryExtraction({
    supabase,
    babyId: baby.id,
    conversationId,
    extraction,
  });
}
