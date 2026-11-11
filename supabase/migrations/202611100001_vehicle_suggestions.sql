create table if not exists public.vehicle_suggestions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  vehicle_type text not null,
  make text not null,
  model text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);
alter table public.vehicle_suggestions enable row level security;
grant select, insert on public.vehicle_suggestions to authenticated;
create policy "Users can submit their own vehicle suggestions" on public.vehicle_suggestions for insert to authenticated with check (owner_id = auth.uid());
create policy "Users can see their own vehicle suggestions" on public.vehicle_suggestions for select to authenticated using (owner_id = auth.uid());
