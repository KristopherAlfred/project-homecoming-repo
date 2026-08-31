ALTER TABLE public.athlete_theme ADD COLUMN fan_app_name text;
UPDATE public.athlete_theme SET fan_app_name = 'Sloane Glo'
WHERE athlete_id = (SELECT id FROM public.athletes WHERE profile_key = 'sloane');