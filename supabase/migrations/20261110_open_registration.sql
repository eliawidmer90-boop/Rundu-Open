-- Midnight at the end of Thursday, 19 November 2026 (Namibia time).
-- Apply to the existing database; preserves all registrations.
begin;
create or replace function public.registration_status() returns text
language plpgsql security definer set search_path = '' as $$
begin
  if clock_timestamp() >= timestamptz '2026-11-20 00:00:00+02' then return 'closed'; end if;
  if not (select registration_open from public.tournament_settings where id) then return 'not-open'; end if;
  if (select count(*) from public.registrations) >= 16 then return 'full'; end if;
  return 'open';
end;
$$;

update public.tournament_settings set registration_open = true where id = true;
commit;
