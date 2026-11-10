-- Run once in the SQL Editor of your own Supabase project.
-- No public table access. Only the website's server can call these functions.
begin;
create table public.tournament_settings (
  id boolean primary key default true check (id),
  registration_open boolean not null default false
);
insert into public.tournament_settings (id) values (true);

create table public.registrations (
  id bigint generated always as identity primary key,
  request_id uuid not null unique,
  participant_name text not null check (char_length(btrim(participant_name)) between 2 and 100),
  whatsapp text not null unique check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  available_both_days boolean not null check (available_both_days),
  received_at timestamptz not null default clock_timestamp()
);
alter table public.registrations enable row level security;
alter table public.tournament_settings enable row level security;
revoke all on public.registrations, public.tournament_settings from anon, authenticated;

create function public.registration_status() returns text
language plpgsql security definer set search_path = '' as $$
begin
  if clock_timestamp() >= timestamptz '2026-11-20 00:00:00+02' then return 'closed'; end if;
  if not (select registration_open from public.tournament_settings where id) then return 'not-open'; end if;
  if (select count(*) from public.registrations) >= 16 then return 'full'; end if;
  return 'open';
end;
$$;

create function public.register_participant(p_name text, p_phone text, p_available boolean, p_request_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare current_status text;
begin
  -- One shared transaction lock serialises submissions, even across Vercel instances.
  -- The lock is released automatically on commit or rollback.
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
  insert into public.registrations(request_id, participant_name, whatsapp, available_both_days)
    values (p_request_id, btrim(p_name), p_phone, p_available);
  return 'accepted';
end;
$$;

revoke all on function public.registration_status() from public, anon, authenticated;
revoke all on function public.register_participant(text,text,boolean,uuid) from public, anon, authenticated;
grant execute on function public.registration_status() to service_role;
grant execute on function public.register_participant(text,text,boolean,uuid) to service_role;
commit;

-- Organiser: use Table Editor while signed into your Supabase dashboard.
-- Sort registrations by received_at ascending, then id ascending.
-- Timestamps are stored in UTC; Namibia is UTC+02:00.
