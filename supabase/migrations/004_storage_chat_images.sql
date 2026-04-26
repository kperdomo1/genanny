-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
);

-- Storage policies: users upload to their own folder (user_id/filename)
CREATE POLICY "Users can upload own chat images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Anyone can view chat images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete own chat images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-images' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
