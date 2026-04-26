-- Knowledge Entries (per-baby persistent facts extracted from conversations)
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_entries_baby_id ON public.knowledge_entries(baby_id);
CREATE INDEX idx_knowledge_entries_category ON public.knowledge_entries(baby_id, category);

ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

-- Knowledge entries are accessed via baby ownership
CREATE POLICY "Users can view knowledge for own babies"
  ON public.knowledge_entries FOR SELECT
  TO authenticated
  USING (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert knowledge for own babies"
  ON public.knowledge_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update knowledge for own babies"
  ON public.knowledge_entries FOR UPDATE
  TO authenticated
  USING (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete knowledge for own babies"
  ON public.knowledge_entries FOR DELETE
  TO authenticated
  USING (
    baby_id IN (
      SELECT id FROM public.babies
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE TRIGGER knowledge_entries_updated_at
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
