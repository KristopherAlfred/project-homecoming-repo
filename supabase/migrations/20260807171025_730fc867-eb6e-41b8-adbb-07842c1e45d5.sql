ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS competition_level text,
  ADD COLUMN IF NOT EXISTS league text,
  ADD COLUMN IF NOT EXISTS position text;