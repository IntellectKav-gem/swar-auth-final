-- SWAR-AUTH canonical RLS hardening
--
-- The Express API is the only client-facing data layer. It authenticates users with
-- application JWTs and accesses Supabase with the server-only service role key.
-- Direct PostgREST access for anon/authenticated roles is therefore denied here.
-- Run this after the canonical schema migration.

BEGIN;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users',
    'students',
    'faculty',
    'subjects',
    'voice_profiles',
    'attendance_sessions',
    'attendance'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "backend_api_only" ON public.%I', table_name);
    EXECUTE format(
      'CREATE POLICY "backend_api_only" ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      table_name
    );
  END LOOP;
END $$;

COMMIT;
