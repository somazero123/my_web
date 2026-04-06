CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  delta INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_sort
  ON public.tasks(user_id, sort_order ASC, created_at ASC);

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_user_title_unique UNIQUE (user_id, title);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "tasks_update_own" ON public.tasks
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "tasks_delete_own" ON public.tasks
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('task-images', 'task-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "task_images_read" ON storage.objects;
CREATE POLICY "task_images_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'task-images');

DROP POLICY IF EXISTS "task_images_insert" ON storage.objects;
CREATE POLICY "task_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-images');

DROP POLICY IF EXISTS "task_images_update" ON storage.objects;
CREATE POLICY "task_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'task-images')
  WITH CHECK (bucket_id = 'task-images');

DROP POLICY IF EXISTS "task_images_delete" ON storage.objects;
CREATE POLICY "task_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'task-images');
