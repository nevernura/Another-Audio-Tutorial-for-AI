# Deploy checklist — How Sound Works

Three things get deployed: the **Next.js frontend** (Vercel), the **librosa service**
(Render, via the Dockerfile), and **Supabase** (managed — optional). The gallery and
lessons 1–6 & 8 work with no backend at all, so you can stop after Step 2 and still have a
live site; the upload feature and the live gallery need Steps 3–4.

Estimated time: ~30 minutes.

---

## 0. Prerequisites (free accounts)
- [ ] GitHub account
- [ ] Vercel account (sign in with GitHub)
- [ ] Render account (sign in with GitHub)
- [ ] Supabase account  *(only if you want the live gallery; otherwise skip Step 3)*

---

## 1. Put the code on GitHub
Create ONE repository containing both folders side by side:

```
your-repo/
├── audio_app_backend/        (from audio_app_backend.zip)
└── next-app/                 (from audio_tutorial_next.zip)
```

- [ ] `git init`, commit both folders, and push to a new GitHub repo.
- [ ] Do NOT commit `next-app/node_modules` or `.env.local` (a `.gitignore` with those lines is enough).

---

## 2. Deploy the frontend → Vercel
- [ ] Vercel → **Add New… → Project** → import your repo.
- [ ] **Root Directory**: click *Edit* and choose `next-app`.
- [ ] Framework preset auto-detects **Next.js**. Leave build settings default.
- [ ] (Env vars come in Step 4 — you can deploy once now to get a URL.)
- [ ] Click **Deploy**. You'll get a URL like `https://your-app.vercel.app`.
- [ ] Visit `/learn` and `/gallery` — they already work from the bundled assets. ✅

---

## 3. (Optional) Set up Supabase — the live gallery
Skip this entirely to keep using the bundled local gallery. If you do it, you MUST seed it
(Step 3d), or the gallery page will have nothing to read.

- [ ] **a.** Create a new Supabase project. Copy the **Project URL** and **anon public key**
      (Settings → API), and the **service_role key** (kept secret, used only in 3d).
- [ ] **b.** SQL Editor → paste and run `next-app/supabase/schema.sql`.
- [ ] **c.** Storage → **New bucket** named `gallery`, set it **Public**.
- [ ] **d.** Seed it from your machine (uploads files + inserts rows):
      ```
      cd next-app
      npm install
      SUPABASE_URL="https://xxxx.supabase.co" \
      SUPABASE_SERVICE_KEY="your-service-role-key" \
      node scripts/seed-supabase.mjs ../audio_app_backend/precompute/gallery
      ```
      You should see "uploaded …" lines and "inserted 9 rows".

---

## 4. Deploy the librosa service → Render
- [ ] Render → **New → Web Service** → connect your repo.
- [ ] **Root Directory**: `audio_app_backend/spectro_service`
- [ ] **Runtime / Language**: Render detects the **Dockerfile** automatically (uses ffmpeg).
- [ ] Instance type: Free is fine to start. Create the service.
- [ ] First build takes a few minutes (librosa wheels). When live you get a URL like
      `https://spectro-xxxx.onrender.com`.
- [ ] Test it: open `https://spectro-xxxx.onrender.com/health` → should show `{"ok":true}`.

> On the free tier the service **sleeps after ~15 min idle**, so the first upload after a
> quiet spell takes ~1 minute to wake. A paid instance (a few $/mo) removes this.

---

## 5. Connect everything (env vars on Vercel)
Vercel → your project → **Settings → Environment Variables**, add:

- [ ] `SPECTRO_URL` = your Render URL (e.g. `https://spectro-xxxx.onrender.com`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL   *(only if you did Step 3)*
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key   *(only if you did Step 3)*

Then **redeploy** (Deployments → ⋯ → Redeploy) so the new vars take effect.

---

## 6. Verify the live site
- [ ] `/learn` → step through all 9 pages; visuals animate, "Show the math" renders.
- [ ] `/gallery` → tiles load (from Supabase if configured, else bundled), audio plays with
      the playhead synced to the spectrogram.
- [ ] `/spectrogram` → drop in a wav/mp3; after the service wakes, the spectrogram appears
      with the synced playhead. (mp3 works because the image includes ffmpeg.)

---

## Troubleshooting
- **Upload says "service unreachable"** → check `SPECTRO_URL` is set and the Render service
  is awake (`/health`). Remember the free-tier wake-up delay.
- **Gallery is empty after enabling Supabase** → you set the Supabase env vars but didn't
  seed (Step 3d), or the bucket isn't Public.
- **mp3 fails locally but works in prod** → local dev has no ffmpeg; the Docker image does.
- **CORS errors** → shouldn't happen: the frontend calls the service through its own
  `/api/spectrogram` route (server-to-server), so the browser never calls Render directly.
