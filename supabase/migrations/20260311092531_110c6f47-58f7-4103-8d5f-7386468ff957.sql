
ALTER TABLE public.tasks ADD COLUMN task_page_type text NOT NULL DEFAULT 'rich_text';
ALTER TABLE public.tasks ADD COLUMN route text;
