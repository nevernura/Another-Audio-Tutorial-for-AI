"""Core spectrogram computation, shared by the live service and the precompute script.
Returns a compact, render-ready representation the frontend can draw on a canvas:
  - a uint8 magnitude matrix (log-frequency rows x time columns), base64-encoded
  - metadata (sample rate, duration, frequency range, seconds-per-column)
  - a PNG preview (magma colormap) as a data URL
Low frequency = row 0 (bottom of the image)."""
import io, base64
import numpy as np
import librosa
from PIL import Image

# --- magma-like colormap LUT (inferno polynomial; smooth & perceptual) ---
def _build_lut():
    t = np.linspace(0, 1, 256)[:, None]
    c = [np.array(v) for v in [
        (0.00021894, 0.00165100, -0.01948090),
        (0.10651342, 0.56395644,  3.93271239),
        (11.6024931, -3.97285397, -15.9423941),
        (-41.7039961, 17.4363989,  44.3541452),
        (77.1629357, -33.4023589, -81.8073093),
        (-71.3194282, 32.6260643,  73.2095199),
        (25.1311262, -12.2426690, -23.0703250)]]
    rgb = c[0] + t*(c[1] + t*(c[2] + t*(c[3] + t*(c[4] + t*(c[5] + t*c[6])))))
    return (np.clip(rgb, 0, 1) * 255).astype(np.uint8)   # (256,3)
_LUT = _build_lut()

def compute_spectrogram(y, sr, n_fft=2048, hop=256, n_bins=256, fmin=30.0,
                        db_floor=-80.0, max_frames=900):
    if y.size == 0:
        raise ValueError("empty audio")
    fmax = sr / 2.0
    D = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop))
    Ddb = librosa.amplitude_to_db(D, ref=np.max)                  # (F_lin, T)
    lin_f = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    log_f = np.logspace(np.log10(fmin), np.log10(fmax), n_bins)

    # resample linear-frequency rows onto log-spaced rows (per time column)
    T = Ddb.shape[1]
    out = np.empty((n_bins, T), dtype=np.float32)
    for j in range(T):
        out[:, j] = np.interp(log_f, lin_f, Ddb[:, j])

    # downsample time to keep the payload small
    stride = max(1, int(np.ceil(T / max_frames)))
    out = out[:, ::stride]
    T2 = out.shape[1]

    # normalize dB -> 0..255
    u8 = np.clip((out - db_floor) / (0.0 - db_floor), 0, 1)
    u8 = (u8 * 255).astype(np.uint8)                              # (n_bins, T2), row0=low freq

    # PNG preview (flip so low freq is at the bottom)
    rgb = _LUT[u8]                                                # (n_bins, T2, 3)
    img = Image.fromarray(np.flipud(rgb), mode="RGB")
    buf = io.BytesIO(); img.save(buf, format="PNG")
    png = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

    return {
        "sr": int(sr),
        "duration": float(len(y) / sr),
        "fmin": float(fmin),
        "fmax": float(fmax),
        "n_bins": int(n_bins),
        "n_frames": int(T2),
        "sec_per_frame": float(hop * stride / sr),
        "db_floor": float(db_floor),
        "matrix_b64": base64.b64encode(u8.tobytes()).decode(),    # row-major, low freq first
        "png": png,
    }
