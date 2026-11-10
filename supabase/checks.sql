-- Use ONLY in a separate, empty TEST project after applying schema.sql.
-- Everything rolls back; do not run on a project holding real registrations.
begin;
do $$
declare i integer; result text; first_id uuid := gen_random_uuid();
begin
  if exists(select 1 from public.registrations) then raise exception 'Use an empty test database'; end if;
  if clock_timestamp() >= timestamptz '2026-11-20 00:00:00+02' then raise exception 'Deadline has passed: test with an adjusted deadline in a TEST project only'; end if;
  if public.registration_status() <> 'not-open' then raise exception 'Expected initial disabled state'; end if;
  update public.tournament_settings set registration_open = true where id;
  result := public.register_participant('Test One', '+264811111111', true, first_id);
  if result <> 'accepted' then raise exception 'First save failed'; end if;
  if public.register_participant('Test One', '+264811111111', true, first_id) <> 'accepted' then raise exception 'Retry failed'; end if;
  if public.register_participant('Duplicate', '+264811111111', true, gen_random_uuid()) <> 'duplicate' then raise exception 'Duplicate accepted'; end if;
  if public.register_participant('Unavailable', '+264811111112', false, gen_random_uuid()) <> 'invalid' then raise exception 'Availability check failed'; end if;
  for i in 2..16 loop
    if public.register_participant('Test ' || i, '+26481222' || lpad(i::text,4,'0'), true, gen_random_uuid()) <> 'accepted' then raise exception 'Slot % failed', i; end if;
  end loop;
  if public.register_participant('Overflow', '+264819999999', true, gen_random_uuid()) <> 'full' then raise exception 'Capacity check failed'; end if;
  if public.registration_summary()->>'registered' <> '16' then raise exception 'Full count incorrect'; end if;
  delete from public.registrations where request_id = first_id;
  if public.registration_summary()->>'registered' <> '15' or public.registration_status() <> 'open' then raise exception 'Removed entry did not free a spot'; end if;
  if public.register_participant('Test One', '+264811111111', true, first_id) <> 'accepted' then raise exception 'Removed player cannot re-register'; end if;
  if (select count(*) from public.registrations) <> 16 then raise exception 'Incorrect count'; end if;
  if has_table_privilege('anon', 'public.registrations', 'SELECT') or has_function_privilege('anon', 'public.register_participant(text,text,boolean,uuid)', 'EXECUTE') then raise exception 'Public access detected'; end if;
  if has_function_privilege('anon', 'public.registration_summary()', 'EXECUTE') or has_function_privilege('authenticated', 'public.registration_summary()', 'EXECUTE') then raise exception 'Public summary function access detected'; end if;
  raise notice 'Sequential database checks passed; concurrency and deadline checks remain.';
end;
$$;
rollback;
