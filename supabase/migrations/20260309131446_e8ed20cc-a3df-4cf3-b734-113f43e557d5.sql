CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update settings" ON public.app_settings FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert settings" ON public.app_settings FOR INSERT TO public WITH CHECK (true);

INSERT INTO public.app_settings (key, value) VALUES
  ('merge_task_title', 'משימת כתיבה ממזגת'),
  ('merge_task_desc', 'משימה קבועה עם 5 תרגילים');