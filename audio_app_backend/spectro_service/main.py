"""FastAPI service: POST an audio file, get back a render-ready spectrogram.
Run locally:  uvicorn main:app --reload --port 8000
Then POST multipart 'file' to http://localhost:8000/spectrogram"""
import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import librosa
from spectro import compute_spectrogram

app = FastAPI(title="Spectrogram service")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/spectrogram")
async def spectrogram(file: UploadFile = File(...)):
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "empty upload")
    try:
        # sr=22050 mono, cap at 30s to keep things snappy
        y, sr = librosa.load(io.BytesIO(raw), sr=22050, mono=True, duration=30)
    except Exception as e:
        raise HTTPException(400, f"could not decode audio (wav/flac/ogg work out of the box; "
                                 f"mp3/m4a need ffmpeg installed): {e}")
    if y.size == 0:
        raise HTTPException(400, "decoded audio is empty")
    return compute_spectrogram(y, sr)
