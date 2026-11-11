create table if not exists public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'partial', 'failed')),
  accepted_count integer not null default 0,
  failed_count integer not null default 0
);
create index if not exists sos_alerts_owner_time_idx on public.sos_alerts(owner_id, created_at desc);
alter table public.sos_alerts enable row level security;
grant select on public.sos_alerts to authenticated;
create policy "Riders see their own SOS alerts" on public.sos_alerts for select to authenticated using (owner_id = (select auth.uid()));

create or replace function public.reserve_sos_alert(p_latitude double precision, p_longitude double precision)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  owner uuid := auth.uid();
  alert_id uuid;
begin
  if owner is null then raise exception 'Authentication required'; end if;
  if p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then raise exception 'Invalid coordinates'; end if;
  perform pg_advisory_xact_lock(hashtextextended(owner::text, 0));
  if exists(select 1 from public.sos_alerts where owner_id = owner and created_at > now() - interval '5 minutes' and status <> 'failed') then return null; end if;
  if (select count(*) from public.sos_alerts where owner_id = owner and created_at > now() - interval '24 hours') >= 5 then return null; end if;
  insert into public.sos_alerts(owner_id, latitude, longitude) values (owner, p_latitude, p_longitude) returning id into alert_id;
  return alert_id;
end;
$$;
revoke all on function public.reserve_sos_alert(double precision, double precision) from public;
grant execute on function public.reserve_sos_alert(double precision, double precision) to authenticated;
