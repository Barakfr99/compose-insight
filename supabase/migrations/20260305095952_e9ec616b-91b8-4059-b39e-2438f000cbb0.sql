
ALTER TABLE public.submissions ADD COLUMN grade integer;

CREATE POLICY "Anyone can update submissions"
  ON public.submissions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete submissions"
  ON public.submissions FOR DELETE
  USING (true);
