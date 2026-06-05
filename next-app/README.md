# How Sound Works — Next.js app (2-page validation build)

Two working pages on the new stack:
- **/spectrogram** — uploads a sound to the librosa service and renders it interactively.
- **/gallery** — the curated sounds, each played with a playhead synced to its spectrogram.

The shared `components/SpectrogramView.jsx` does the rendering (magma colormap, click-to-seek,
hover time/frequency readout, synced playhead).

## Run locally
```
npm install
cp .env.local.example .env.local          # defaults are fine for local
npm run dev                                # http://localhost:3000
```
The gallery works immediately from the bundled `public/gallery/` copy.
For uploads, also run the librosa service (see ../audio_app_backend):
```
cd ../audio_app_backend/spectro_service && uvicorn main:app --port 8000
```

## Wire up Supabase (optional, for the hosted gallery)
1. Create a project. Run `supabase/schema.sql` in the SQL editor.
2. Create a PUBLIC Storage bucket named `gallery`; upload `precompute/gallery/*` into it.
3. Seed rows: `SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/seed-supabase.mjs ../audio_app_backend/precompute/gallery`
4. Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
   With those set, the gallery reads from Supabase; without them, it uses the local copy.

## Deploy
- Frontend → Vercel (set `SPECTRO_URL`, `NEXT_PUBLIC_SUPABASE_*` env vars).
- librosa service → Render/Railway/Fly (set `SPECTRO_URL` to its URL).
