# Genanny — Implementation Plan

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Next.js 15 App Router (PWA via Serwist)    │
│  ┌───────────┐  ┌────────────────────────┐  │
│  │  Auth UI   │  │  Chat UI (mobile-first)│  │
│  │  (login,   │  │  - text + image input  │  │
│  │  signup)   │  │  - streaming responses │  │
│  └───────────┘  │  - baby selector       │  │
│  ┌───────────┐  └────────────────────────┘  │
│  │  Baby      │                              │
│  │  Profiles  │                              │
│  └───────────┘                              │
├─────────────────────────────────────────────┤
│  API Routes (Next.js Route Handlers)        │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ │
│  │ /api/chat │ │ /api/baby │ │/api/upload │ │
│  └──────────┘ └───────────┘ └────────────┘ │
├─────────────────────────────────────────────┤
│  Services Layer                             │
│  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Gemini Client │  │ Memory Extraction   │ │
│  │ (@google/genai)│  │ (2nd Gemini call)   │ │
│  └──────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────┤
│  Supabase                                   │
│  ┌──────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Auth │ │ Database │ │ Storage (imgs) │  │
│  └──────┘ └──────────┘ └────────────────┘  │
└─────────────────────────────────────────────┘
```

## Tech Stack (Verified)

| Technology | Package | Version |
|---|---|---|
| Next.js | `next` | 15 (App Router) |
| PWA | `@serwist/next` + `serwist` | 9.x |
| Tailwind | `tailwindcss` | v4 (CSS-first config) |
| Supabase | `@supabase/supabase-js` + `@supabase/ssr` | 2.x / 0.10.x |
| Gemini | `@google/genai` | 1.x |
| Deployment | Vercel | — |

### Anti-Patterns to Avoid
- ❌ `@google/generative-ai` — deprecated Aug 2025, use `@google/genai`
- ❌ `@supabase/auth-helpers-nextjs` — deprecated, use `@supabase/ssr`
- ❌ `next-pwa` — unmaintained, use `@serwist/next`
- ❌ `tailwind.config.js` — Tailwind v4 uses CSS-first `@theme` in globals.css
- ❌ `supabase.auth.getSession()` on server — use `getUser()` (JWT not validated otherwise)
- ❌ Sync `params` in Next.js 15 — `params` is a Promise, must `await`

## Database Schema

```sql
-- Profiles (auto-created on signup via trigger)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Babies
CREATE TABLE public.babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Entries (per-baby persistent facts)
CREATE TABLE public.knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'milestone', 'sleep', 'illness', 'temperament',
    'feeding', 'trip', 'medical', 'general'
  )),
  content TEXT NOT NULL,
  date_referenced DATE,
  source_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: all tables scoped to user_id
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
```

## Memory System Design

### How It Works

After each AI response in a conversation:

1. **Conversation summary update**: A background Gemini call receives the full conversation so far and produces a concise summary. This is stored in `conversations.summary`.

2. **Knowledge extraction**: The same (or a separate) Gemini call extracts discrete facts with categories and absolute dates. These are upserted into `knowledge_entries`.

3. **Cross-conversation correction**: When a user says something like "actually she started crawling on March 5th, not March 1st", the extraction prompt instructs Gemini to output correction directives. The API then updates/deletes old conflicting entries.

### System Prompt Template

```
You are Genanny, a knowledgeable and caring 24/7 pediatric advisor.

TODAY'S DATE: {today}

BABY PROFILE:
- Name: {name}
- Date of Birth: {dob} (Age: {age_months} months, {age_days} days)
- Gender: {gender}
{notes}

KNOWLEDGE BASE (what you know about {name}):
{knowledge_entries sorted by date_referenced DESC}

RECENT CONVERSATION SUMMARIES:
{last 5 conversation summaries with dates}

INSTRUCTIONS:
- Always reference dates absolutely (e.g., "on March 15, 2025") not relatively
- When the parent corrects a previous fact, acknowledge the correction
- Be warm, evidence-based, and always recommend consulting a pediatrician for serious concerns
- You are NOT a replacement for medical advice — always caveat serious health concerns
```

### Memory Extraction Prompt

```
Given this conversation about baby {name} (born {dob}), extract:

1. SUMMARY: A 2-3 sentence summary of this conversation so far.

2. KNOWLEDGE ENTRIES: Any new facts learned. For each:
   - category: one of [milestone, sleep, illness, temperament, feeding, trip, medical, general]
   - content: the fact (use absolute dates, today is {today})
   - date_referenced: YYYY-MM-DD if applicable, null otherwise
   - action: "create", "update", or "delete"
   - update_match: (for update/delete) description of the entry to update/delete

Respond in JSON format.
```

---

## Phase 1: Project Scaffolding

### Tasks
1. Run `npx create-next-app@latest genanny --ts --tailwind --eslint --app --src-dir`
2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js @supabase/ssr @google/genai
   npm install @serwist/next serwist
   ```
3. Set up PWA:
   - Create `src/app/manifest.ts` (name: "Genanny", display: standalone, theme colors)
   - Create `src/app/sw.ts` (Serwist service worker)
   - Wrap `next.config.ts` with `withSerwistInit`
   - Add `public/sw.js` to `.gitignore`
4. Set up Supabase utility files:
   - `src/lib/supabase/client.ts` (browser client via `createBrowserClient`)
   - `src/lib/supabase/server.ts` (server client via `createServerClient`)
   - `src/middleware.ts` (auth session refresh + route protection)
5. Create `.env.local.example` with required env vars:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   GOOGLE_API_KEY=
   ```
6. Initialize git repo, create `.gitignore` additions
7. Set up base layout with mobile-first viewport meta

### Verification
- `npm run dev` starts without errors
- PWA manifest accessible at `/manifest.webmanifest`
- Supabase clients importable without errors

---

## Phase 2: Auth + Baby Profiles

### Tasks
1. Create Supabase migration for `profiles` and `babies` tables with RLS policies
2. Create auth pages:
   - `src/app/(auth)/login/page.tsx` — email/password + Google OAuth button
   - `src/app/(auth)/signup/page.tsx` — registration form
   - `src/app/auth/callback/route.ts` — OAuth callback (PKCE code exchange)
3. Create auth actions (Server Actions):
   - `src/app/(auth)/actions.ts` — signUp, signIn, signInWithGoogle, signOut
4. Update middleware to protect `/dashboard/*` routes
5. Create baby profile management:
   - `src/app/dashboard/babies/page.tsx` — list babies, add baby form
   - `src/app/dashboard/babies/[id]/page.tsx` — edit baby profile
   - Server actions for CRUD on babies
6. Create dashboard layout with baby selector in header/sidebar
7. Create a Supabase trigger to auto-create profile on auth.users insert

### Verification
- Can sign up, log in, log out
- Can add/edit multiple baby profiles
- Unauthenticated users redirected to /login
- RLS prevents cross-user data access

---

## Phase 3: Chat UI + Gemini Integration

### Tasks
1. Create Supabase migration for `conversations` and `messages` tables with RLS
2. Create chat UI:
   - `src/app/dashboard/chat/page.tsx` — main chat view (redirects to new or latest conversation)
   - `src/app/dashboard/chat/[id]/page.tsx` — conversation view
   - `src/components/chat/ChatMessages.tsx` — message list (scrollable, auto-scroll)
   - `src/components/chat/ChatInput.tsx` — text input + send button (mobile-optimized)
   - `src/components/chat/MessageBubble.tsx` — individual message styling
3. Create Gemini service:
   - `src/lib/gemini/client.ts` — initialize `GoogleGenAI`, helper to create chat
   - `src/lib/gemini/system-prompt.ts` — build system prompt from baby profile + knowledge base
4. Create chat API route:
   - `POST /api/chat/route.ts` — receives message, loads context, calls Gemini, streams response
   - Stores user message and assistant response in `messages` table
   - Returns streamed response to client
5. Create conversation management:
   - `src/app/dashboard/conversations/page.tsx` — conversation history list
   - API to create new conversation, list conversations for a baby
6. Wire up baby selector to chat (conversations are per-baby)

### Verification
- Can start a new conversation for a selected baby
- Can send a text message and receive a streamed AI response
- Messages persist in database and reload on page refresh
- Conversation history is visible and navigable

---

## Phase 4: Knowledge Base System

### Tasks
1. Create Supabase migration for `knowledge_entries` table with RLS
2. Create memory extraction service:
   - `src/lib/gemini/memory-extraction.ts` — takes conversation messages, calls Gemini with extraction prompt, returns structured JSON
3. Integrate into chat flow:
   - After each AI response, fire a background call to extract/update memory
   - Update `conversations.summary`
   - Upsert/update/delete `knowledge_entries` based on extraction results
4. Update system prompt builder:
   - Load all `knowledge_entries` for the baby, sorted by date
   - Load last 5 conversation summaries
   - Include today's date and baby's computed age
5. Handle cross-conversation corrections:
   - Extraction prompt includes "update" and "delete" actions
   - Match existing entries by category + content similarity
   - Update or remove stale entries

### Verification
- After a conversation mentioning "baby started crawling on April 1st", a knowledge entry exists with category=milestone, date=2025-04-01
- New conversations include this fact in the system prompt
- Correcting a fact in a new conversation updates the old entry
- Conversation summaries update incrementally

---

## Phase 5: Image Support

### Tasks
1. Create Supabase Storage bucket `chat-images` with RLS policies
2. Create image upload API:
   - `POST /api/upload/route.ts` — receives image file, uploads to Supabase Storage, returns URL
3. Update ChatInput component:
   - Add image attachment button (camera icon)
   - Image preview before sending
   - Compress/resize on client if needed (max ~4MB for Gemini)
4. Update chat API route:
   - When message includes image_url, download from Supabase Storage
   - Convert to base64, include as `inlineData` part in Gemini message
   - Store image_url in messages table
5. Update MessageBubble to display images inline

### Verification
- Can attach and send an image with a text message
- AI responds with context about the image
- Images display in chat history on reload

---

## Phase 6: PWA Polish + Deployment

### Tasks
1. PWA enhancements:
   - App icons (192x192, 512x512) — generate from a simple logo
   - Splash screen configuration
   - Offline fallback page
   - "Add to Home Screen" prompt
2. Mobile UX polish:
   - Safe area insets for notched phones
   - Keyboard handling (input stays above keyboard)
   - Pull-to-refresh on conversation list
   - Haptic-style feedback on send
3. Loading states and error handling:
   - Skeleton loaders for chat messages
   - Error boundaries for API failures
   - Toast notifications for background operations (memory saved, etc.)
4. Vercel deployment:
   - Set environment variables in Vercel dashboard
   - Configure Supabase URL/key for production
   - Set up Google OAuth redirect URI for production domain
5. Performance:
   - Verify Lighthouse PWA score
   - Optimize bundle size

### Verification
- PWA installable on iOS and Android
- Lighthouse PWA score > 90
- All features work in production on Vercel
- OAuth flow works with production domain

---

## File Structure (Final)

```
genanny/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── actions.ts
│   │   ├── auth/
│   │   │   └── callback/route.ts
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── babies/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── conversations/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── chat/route.ts
│   │   │   └── upload/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── manifest.ts
│   │   └── sw.ts
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatMessages.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── MessageBubble.tsx
│   │   ├── babies/
│   │   │   ├── BabyCard.tsx
│   │   │   └── BabyForm.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── gemini/
│   │       ├── client.ts
│   │       ├── system-prompt.ts
│   │       └── memory-extraction.ts
│   └── middleware.ts
├── supabase/
│   └── migrations/
│       ├── 001_profiles_babies.sql
│       ├── 002_conversations_messages.sql
│       └── 003_knowledge_entries.sql
├── public/
│   ├── icons/
│   └── .gitkeep
├── next.config.ts
├── .env.local.example
├── package.json
└── tsconfig.json
```

## Free Tier Considerations

Gemini 2.5 Flash free tier limits:
- **10 requests/minute**, **250 requests/day**
- Memory extraction doubles the request count (1 chat + 1 extraction per user message)
- Effective limit: ~125 user messages/day across all users
- For MVP/personal use this is fine; for scaling, will need paid tier

Mitigation strategies:
- Skip memory extraction if conversation hasn't changed meaningfully
- Batch extraction (every 3-5 messages instead of every message)
- Cache system prompts (don't rebuild if knowledge base hasn't changed)
