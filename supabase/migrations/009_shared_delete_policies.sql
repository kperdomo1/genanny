-- Allow partners to delete shared conversations
DROP POLICY "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete shared conversations"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid()))));

-- Also allow partners to update shared conversations (for summary updates)
DROP POLICY "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update shared conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid()))))
  WITH CHECK (user_id IN (SELECT public.get_shared_user_ids((SELECT auth.uid()))));
