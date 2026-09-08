-- ============================================================
-- AthleteLinQ M2 (part 1): video storage setup
-- Run ONCE in: Supabase -> SQL Editor -> New query
-- ============================================================

-- 1. Create the storage bucket for video files.
--    Public read (anyone can watch), 50MB max per file, video types only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos', 'videos', true, 52428800,
  array['video/mp4','video/quicktime','video/webm','video/x-matroska']
)
on conflict (id) do nothing;

-- 2. Storage rules: anyone can watch; athletes can only upload/delete
--    inside their own folder (their user id).
create policy "Anyone can view videos"
  on storage.objects for select
  using (bucket_id = 'videos');

create policy "Users upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Let athletes delete their own video records (table side).
create policy "athlete deletes own videos"
  on public.videos for delete
  using (auth.uid() = athlete_id);
