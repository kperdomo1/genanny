# Genanny — Your 24/7 AI Pediatric Advisor

AI-powered pediatric advisor that remembers everything about your baby. Built with Next.js, Supabase, and Gemini.

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd genanny
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in order from `supabase/migrations/`:
   - `001_profiles_babies.sql`
   - `002_conversations_messages.sql`
   - `003_knowledge_entries.sql`
   - `004_storage_chat_images.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Google AI Studio

1. Get an API key at [aistudio.google.com](https://aistudio.google.com/apikey)

### 4. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GOOGLE_API_KEY`

### 5. Run

```bash
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add the 3 environment variables in Vercel dashboard
4. Deploy

For Google OAuth: add your Vercel domain to Supabase Auth > URL Configuration > Redirect URLs.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, PWA via Serwist
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **AI**: Gemini 2.5 Flash via Google AI Studio
- **Deployment**: Vercel
