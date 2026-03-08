-- Create tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Public RLS policies
CREATE POLICY "Anyone can read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete tasks" ON public.tasks FOR DELETE USING (true);

-- Add task_id to submissions (nullable for backward compat)
ALTER TABLE public.submissions ADD COLUMN task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;