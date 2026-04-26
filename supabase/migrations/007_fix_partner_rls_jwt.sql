-- Fix: Use auth.jwt() instead of querying auth.users (not accessible from RLS context)

DROP POLICY "Users can view own partnerships" ON public.partners;
CREATE POLICY "Users can view own partnerships"
  ON public.partners FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = inviter_id OR
    (SELECT auth.uid()) = invitee_id OR
    lower(invitee_email) = lower((SELECT auth.jwt() ->> 'email'))
  );

DROP POLICY "Users can update own partnerships" ON public.partners;
CREATE POLICY "Users can update own partnerships"
  ON public.partners FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = inviter_id OR
    (SELECT auth.uid()) = invitee_id OR
    lower(invitee_email) = lower((SELECT auth.jwt() ->> 'email'))
  );
