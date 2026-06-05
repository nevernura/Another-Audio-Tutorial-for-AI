# librosa spectrogram service — container image (works on Render, Railway, Fly, etc.)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ffmpeg -> enables mp3/m4a decoding; libsndfile1 -> wav/flac/ogg via soundfile
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
# (librosa pulls numpy/scipy/numba wheels — the first build takes a few minutes)
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
# Hosts inject $PORT; default to 8000 locally
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
