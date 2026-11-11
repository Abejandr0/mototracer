insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('moto-private', 'moto-private', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "Riders read own private photos" on storage.objects for select to authenticated using (bucket_id = 'moto-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Riders upload own private photos" on storage.objects for insert to authenticated with check (bucket_id = 'moto-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Riders delete own private photos" on storage.objects for delete to authenticated using (bucket_id = 'moto-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
