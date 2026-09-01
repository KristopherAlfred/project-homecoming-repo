DELETE FROM public.athlete_fan_apps a
USING public.athlete_fan_apps b
WHERE a.athlete_id = b.athlete_id AND a.ctid > b.ctid;

ALTER TABLE public.athlete_fan_apps
  ADD CONSTRAINT athlete_fan_apps_athlete_id_key UNIQUE (athlete_id);