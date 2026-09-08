-- 2026-09-08: bobby_publish_debate is SECURITY DEFINER and was EXECUTE-granted to
-- public/anon/authenticated. The HMAC receipt is verified only in api/forum-publish.ts;
-- the function itself accepts any unused uuid, so an anonymous PostgREST caller could
-- create scope='public' forum threads that forum-resolve then records on-chain into
-- Bobby's public track record. The only legitimate caller is the server (service_role).
-- bobby_rls_matrix / bobby_rls_status leak policy metadata to anon; same treatment.
-- Applied to production qbvdqkknnuweatptjohi via Supabase MCP on 2026-09-08.
revoke execute on function public.bobby_publish_debate(uuid, text, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.bobby_rls_matrix() from public, anon, authenticated;
revoke execute on function public.bobby_rls_status() from public, anon, authenticated;
grant execute on function public.bobby_publish_debate(uuid, text, jsonb, jsonb) to service_role;
grant execute on function public.bobby_rls_matrix() to service_role;
grant execute on function public.bobby_rls_status() to service_role;
