create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text not null default '',
  avatar_url text,
  home_region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  make text not null,
  model text not null,
  year integer,
  odometer_km integer not null default 0 check (odometer_km >= 0),
  oil_interval_km integer not null default 3000 check (oil_interval_km > 0),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null,
  performed_at date not null default current_date,
  odometer_km integer not null check (odometer_km >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  comparison_ride_id uuid references public.rides(id) on delete set null,
  title text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  distance_km numeric(10,3) not null default 0 check (distance_km >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  max_speed_kmh numeric(7,2) not null default 0,
  average_speed_kmh numeric(7,2) not null default 0,
  max_lean_left numeric(6,2) not null default 0,
  max_lean_right numeric(6,2) not null default 0,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ride_points (
  ride_id uuid not null references public.rides(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  recorded_at timestamptz not null,
  speed_kmh real not null default 0,
  lean_degrees real not null default 0,
  g_force real,
  altitude_m double precision,
  primary key (ride_id, sequence)
);

create table if not exists public.ride_likes (
  ride_id uuid not null references public.rides(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ride_id, user_id)
);

create table if not exists public.rider_backups (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(data) = 'object')
);

create index if not exists rides_public_created_idx on public.rides (created_at desc) where is_public;
create index if not exists rides_owner_created_idx on public.rides (owner_id, started_at desc);
create index if not exists ride_points_order_idx on public.ride_points (ride_id, sequence);
create index if not exists service_records_vehicle_date_idx on public.service_records (vehicle_id, performed_at desc);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_records enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.rides enable row level security;
alter table public.ride_points enable row level security;
alter table public.ride_likes enable row level security;
alter table public.rider_backups enable row level security;

grant select, insert, update, delete on public.profiles, public.vehicles, public.service_records, public.emergency_contacts, public.rides, public.ride_points, public.ride_likes, public.rider_backups to authenticated;

create policy "Owners manage private app backup" on public.rider_backups for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "Profiles readable by signed in riders" on public.profiles;
create policy "Profiles readable by signed in riders" on public.profiles for select to authenticated using (true);
create policy "Riders create own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "Riders update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Owners manage vehicles" on public.vehicles for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners manage maintenance" on public.service_records for all to authenticated using (owner_id = (select auth.uid()) and exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = (select auth.uid()))) with check (owner_id = (select auth.uid()) and exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = (select auth.uid())));
create policy "Owners manage emergency contacts" on public.emergency_contacts for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "Owners and public rides readable" on public.rides for select to authenticated using (owner_id = (select auth.uid()) or is_public);
create policy "Owners create rides" on public.rides for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owners update own rides" on public.rides for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners delete own rides" on public.rides for delete to authenticated using (owner_id = (select auth.uid()));

create policy "Ride points visible with ride" on public.ride_points for select to authenticated using (owner_id = (select auth.uid()) or exists (select 1 from public.rides r where r.id = ride_id and r.is_public));
create policy "Owners write ride points" on public.ride_points for insert to authenticated with check (owner_id = (select auth.uid()) and exists (select 1 from public.rides r where r.id = ride_id and r.owner_id = (select auth.uid())));
create policy "Owners update ride points" on public.ride_points for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners delete ride points" on public.ride_points for delete to authenticated using (owner_id = (select auth.uid()));

create policy "Signed in riders see likes" on public.ride_likes for select to authenticated using (true);
create policy "Riders like routes" on public.ride_likes for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.rides r where r.id = ride_id and r.is_public));
create policy "Riders remove own likes" on public.ride_likes for delete to authenticated using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('moto-media', 'moto-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Riders read public media" on storage.objects for select to authenticated using (bucket_id = 'moto-media');
create policy "Riders upload own media" on storage.objects for insert to authenticated with check (bucket_id = 'moto-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Riders update own media" on storage.objects for update to authenticated using (bucket_id = 'moto-media' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'moto-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Riders delete own media" on storage.objects for delete to authenticated using (bucket_id = 'moto-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
