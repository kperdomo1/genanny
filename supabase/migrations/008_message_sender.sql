-- Add sender tracking to messages so we can show who sent each message
ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES public.profiles(id);

-- Backfill existing messages: set user_id from the conversation owner
UPDATE public.messages m
SET user_id = c.user_id
FROM public.conversations c
WHERE m.conversation_id = c.id AND m.role = 'user';
