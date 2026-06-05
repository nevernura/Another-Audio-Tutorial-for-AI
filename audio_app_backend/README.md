# Audio tutorial — backend (librosa)

Two parts that share one spectrogram implementation (`spectro_service/spectro.py`):

- **spectro_service/** — FastAPI app with `POST /spectrogram`: upload a sound, get back a
  render-ready spectrogram (uint8 matrix + PNG + metadata). This powers the "upload any
  sound" feature on the spectrogram page.
- **precompute/** — `build_gallery.py` synthesizes the curated gallery sounds and runs them
  through the same code, writing `gallery/` (wav + json + png per sound + manifest.json).
  Upload `gallery/` to a Supabase Storage bucket and load `manifest.json` rows into a table.

## Quick start
```
cd spectro_service && pip install -r requirements.txt && uvicorn main:app --port 8000
cd ../precompute && python build_gallery.py    # regenerates gallery/
```

## How the frontend uses the output
`matrix_b64` decodes to a uint8 array of shape (n_bins x n_frames), low frequency first.
The Next.js app draws it to a canvas with a colormap and overlays a playhead at
`x = audio.currentTime / duration * width` — that's what keeps sound and picture in sync.

## Next steps (Next.js + Supabase) — coming in the next build
- Supabase: a `gallery` table (id, title, category, description, duration, storage paths)
  + a public Storage bucket holding the gallery files.
- Next.js: guided-step UI; gallery page reads Supabase + syncs playhead; spectrogram page
  posts uploads to this service. Env: NEXT_PUBLIC_SPECTRO_URL, NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY.
