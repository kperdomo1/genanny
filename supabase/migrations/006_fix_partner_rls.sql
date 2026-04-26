-- Fix: Allow invitees to see pending invitations by email match
-- The previous policy only checked invitee_id, which is NULL until accepted

DROP POLICY "Users can view own partnerships" ON public.partners;
CREATE POLICY "Users can view own partnerships"
  ON public.partners FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = inviter_id OR
    (SELECT auth.uid()) = invitee_id OR
    invitee_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

-- Fix: Allow invitees to update (accept) invitations matched by email
DROP POLICY "Users can update own partnerships" ON public.partners;
CREATE POLICY "Users can update own partnerships"
  ON public.partners FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = inviter_id OR
    (SELECT auth.uid()) = invitee_id OR
    invitee_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );
