-- Allow public read of user-files objects that are referenced by files in public spaces
create policy "Public can select user-files for public spaces"
on storage.objects
for select
to public
using (
  bucket_id = 'user-files'
  and exists (
    select 1
    from public.space_files sf
    join public.spaces s on s.id = sf.space_id
    join public.files f on f.id = sf.file_id
    where f.storage_path = storage.objects.name
      and s.is_public = true
  )
);
