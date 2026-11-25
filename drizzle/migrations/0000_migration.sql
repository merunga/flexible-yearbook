CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  group_slug text NOT NULL,
  cover_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  path text NOT NULL,
  kind text NOT NULL DEFAULT 'image',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff manage media" ON public.media FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff read media files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media');
CREATE POLICY "staff upload media files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "staff delete media files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');