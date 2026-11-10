-- Run in Supabase SQL Editor to enable the public count indicators.
-- Existing entries, opening switch, capacity and deadline are preserved.
begin;

create or replace function public.registration_summary() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare player_count integer;
begin
  select count(*) into player_count from public.registrations;
  return jsonb_build_object(
    'status', public.registration_status(),
    'registered', player_count
  );
end;
$$;

revoke all on function public.registration_summary() from public, anon, authenticated;
grant execute on function public.registration_summary() to service_role;
commit;
