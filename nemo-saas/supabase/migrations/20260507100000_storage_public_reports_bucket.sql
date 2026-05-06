-- Wedge PDFs: public bucket for getPublicUrl() (no signed URL).
-- Run after 20260429000000_init.sql on hosted Supabase if you use /api/lvs.

insert into storage.buckets (id, name, public, file_size_limit)
values ('public-reports', 'public-reports', true, 52428800)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = coalesce(excluded.file_size_limit, storage.buckets.file_size_limit);

drop policy if exists "public_read_public_reports" on storage.objects;
create policy "public_read_public_reports"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'public-reports');

drop policy if exists "service_all_public_reports" on storage.objects;
create policy "service_all_public_reports"
on storage.objects
for all
to service_role
using (bucket_id = 'public-reports')
with check (bucket_id = 'public-reports');
