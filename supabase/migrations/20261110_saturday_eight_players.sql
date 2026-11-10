-- Run in Supabase SQL Editor after the earlier registration migrations.
-- Limits registration to 8 players and records Saturday availability only.
-- Existing entries and the registration opening switch are preserved.
begin;

-- Existing confirmations included Saturday, so their true values remain valid.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'registrations'
      and column_name = 'available_both_days'
  ) then
    alter table public.registrations rename column available_both_days to available_saturday;
  end if;
end;
$$;

create or replace function public.registration_status() returns text
language plpgsql security definer set search_path = '' as $$
begin
  if clock_timestamp() >= timestamptz '2026-11-20 00:00:00+02' then return 'closed'; end if;
  if not (select registration_open from public.tournament_settings where id) then return 'not-open'; end if;
  if (select count(*) from public.registrations) >= 8 then return 'full'; end if;
  return 'open';
end;
$$;

create or replace function public.register_participant(p_name text, p_phone text, p_available boolean, p_request_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare current_status text;
begin
  -- One shared transaction lock serialises submissions, even across Vercel instances.
  -- The lock is released automatically on commit or rollback.
  -- Keep this lock key stable when changing capacity.
  perform pg_advisory_xact_lock(2026, 16);
  if p_name is null or char_length(btrim(p_name)) not between 2 and 100
    or p_phone is null or p_phone !~ '^\+[1-9][0-9]{7,14}$'
    or p_available is distinct from true or p_request_id is null then return 'invalid'; end if;
  -- A retry after a lost response remains successful, even after closing.
  if exists(select 1 from public.registrations where request_id = p_request_id
    and participant_name = btrim(p_name) and whatsapp = p_phone) then return 'accepted'; end if;
  if exists(select 1 from public.registrations where request_id = p_request_id) then return 'invalid'; end if;
  current_status := public.registration_status();
  if current_status <> 'open' then return current_status; end if;
  if exists(select 1 from public.registrations where whatsapp = p_phone) then return 'duplicate'; end if;
  insert into public.registrations(request_id, participant_name, whatsapp, available_saturday)
    values (p_request_id, btrim(p_name), p_phone, p_available);
  return 'accepted';
end;
$$;

commit;
