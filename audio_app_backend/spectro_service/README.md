# Spectrogram service (FastAPI + librosa)

Computes a render-ready spectrogram for any uploaded sound.

## Run locally
```
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Test:
```
curl -F "file=@some_sound.wav" http://localhost:8000/spectrogram
```

## Response (JSON)
- `matrix_b64` — base64 of a uint8 matrix, shape (n_bins x n_frames), row 0 = lowest
  frequency. Decode in JS to a Uint8Array and draw to a canvas with your colormap.
- `png` — a ready-to-show PNG data URL (magma), low frequency at the bottom.
- `sr, duration, fmin, fmax, n_bins, n_frames, sec_per_frame` — for axes + a playhead
  (playhead x = currentTime / duration * width).

## Deploy (any of these)
- **Render / Railway / Fly.io**: point at this folder; start command
  `uvicorn main:app --host 0.0.0.0 --port $PORT`. Add a buildpack/Docker with ffmpeg
  if you want mp3/m4a support.
- Set the deployed URL as `NEXT_PUBLIC_SPECTRO_URL` in the Next.js app.

Note: librosa decodes wav/flac/ogg via libsndfile out of the box; mp3/m4a need ffmpeg.
