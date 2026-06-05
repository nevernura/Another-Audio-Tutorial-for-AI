-- Run in the Supabase SQL editor.

-- 1) Gallery metadata table
create table if not exists public.gallery (
  id          text primary key,
  title       text not null,
  category    text,
  description text,
  duration    real,
  audio       text not null,   -- storage path, e.g. 'chirp.wav'
  png         text not null,   -- e.g. 'chirp.png'
  data        text not null    -- e.g. 'chirp.json'
);

-- 2) Public read access (tutorial content is public)
alter table public.gallery enable row level security;
create policy "gallery is readable by anyone"
  on public.gallery for select using (true);

-- 3) Create a PUBLIC storage bucket named 'gallery' in the dashboard
--    (Storage -> New bucket -> name: gallery, Public: on),
--    then upload the contents of precompute/gallery/* into it,
--    and run scripts/seed-supabase.mjs to insert the manifest rows.
