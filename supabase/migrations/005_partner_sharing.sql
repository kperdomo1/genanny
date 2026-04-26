-- Partners table: links two users who share access to each other's babies
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(inviter_id, invitee_email)
);

CREATE INDEX idx_partners_inviter ON public.partners(inviter_id);
CREATE INDEX idx_partners_invitee ON public.partners(invitee_id);
CREATE INDEX idx_partners_email ON public.partners(invitee_email);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own partnerships"
  ON public.partners FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = inviter_id OR
    (SELECT auth.uid()) = invitee_id
  );

CREATE POLICY "Users can create invitations"
  ON public.partners FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = inviter_id);

CREATE POLICY "Users can update own partnerships"
  ON public.partners FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = inviter_id OR
    (SELECT auth.uid()) = invitee_id
  );

CREATE POLICY "Users can delete own partnerships"
  ON public.partners FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = inviter_id);

-- Helper function: returns all user IDs that share access with the given user
CREATE OR REPLACE FUNCTION public.get_shared_user_ids(uid UUID)
RETURNS SETOF UUID AS $$
  -- The user themselves
  SELECT uid
  UNION
  -- Users who invited me (accepted)
  SELECT inviter_id FROM public.partners
    WHERE invitee_id = uid AND status = 'accepted'
  UNION
  -- Users I invited (accepted)
  SELECT invitee_id FROM public.partners
    WHERE inviter_id = uid AND status = 'accepted'
    AND invitee_id IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update RLS policies on babies to include partner access
DROP POLICY "Users can view own babies" ON public.babies;
CREATE POLICY "Users can view shared babies"
  ON public.babies FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid()))));

-- Update RLS policies on conversations to include partner access
DROP POLICY "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view shared conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid()))));

-- Partners can also create conversations for shared babies
DROP POLICY "Users can create own conversations" ON public.conversations;
CREATE POLICY "Users can create shared conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid())))
    )
  );

-- Update messages policies for partner access
DROP POLICY "Users can view messages of own conversations" ON public.messages;
CREATE POLICY "Users can view messages of shared conversations"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid())))
    )
  );

DROP POLICY "Users can insert messages to own conversations" ON public.messages;
CREATE POLICY "Users can insert messages to shared conversations"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid())))
    )
  );

-- Update knowledge_entries policies for partner access
DROP POLICY "Users can view knowledge for own babies" ON public.knowledge_entries;
CREATE POLICY "Users can view knowledge for shared babies"
  ON public.knowledge_entries FOR SELECT
  TO authenticated
  USING (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid())))
    )
  );

DROP POLICY "Users can insert knowledge for own babies" ON public.knowledge_entries;
CREATE POLICY "Users can insert knowledge for shared babies"
  ON public.knowledge_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid())))
    )
  );

DROP POLICY "Users can update knowledge for own babies" ON public.knowledge_entries;
CREATE POLICY "Users can update knowledge for shared babies"
  ON public.knowledge_entries FOR UPDATE
  TO authenticated
  USING (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid())))
    )
  )
  WITH CHECK (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid())))
    )
  );

DROP POLICY "Users can delete knowledge for own babies" ON public.knowledge_entries;
CREATE POLICY "Users can delete knowledge for shared babies"
  ON public.knowledge_entries FOR DELETE
  TO authenticated
  USING (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid())))
    )
  );
