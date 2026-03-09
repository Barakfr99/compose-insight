ALTER TABLE public.submissions ADD COLUMN task_type text NOT NULL DEFAULT 'default';

UPDATE public.submissions
SET task_type = 'merge_writing'
WHERE task_id IS NULL
  AND answer_text LIKE '{%}'
  AND answer_text LIKE '%writing_%';