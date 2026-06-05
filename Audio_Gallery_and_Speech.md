# Audio Gallery & Speech Analysis — *new module*

This module is a **preview add-on** for the Audio Processing tutorial. It does two things:

1. **An audio gallery** — for several *kinds* of sound (synthetic, percussion, an instrument, birdsong, singing) we *play* the clip and show its *spectrogram*. Different sounds make different features stand out, which is the whole point.
2. **A speech mini-study** — **voiced vs. unvoiced** sounds and **male vs. female** voices, seen both *visually* (spectrogram) and *numerically* (zero-crossing rate, energy, pitch).

There's also a **live-recording cell** so you can analyse your *own* voice.

Each section is **layered**: a plain-English *intuition* line, then a short **"The math"** block with the formal grounding. Read the math if you want the rigour; skip it if you just want the picture.

> Built for **Google Colab**. All audio is either *synthesized in code* (runs anywhere) or pulled from `librosa`'s built-in examples.

## 0. Setup
Run this once. On Colab, uncomment the `%pip` line the first time.

```python
# On Colab, uncomment the next line the first time you run the notebook:
# %pip install librosa soundfile -q

import numpy as np
import matplotlib.pyplot as plt
import librosa
import librosa.display
import IPython.display as ipd
from scipy.signal import lfilter

SR = 22050          # sample rate (samples per second)
np.random.seed(0)   # makes the noise-based sounds reproducible

print("Ready. librosa version:", librosa.__version__)
```

```python
def play_and_show(y, sr, title, fmax=None):
    """Play an audio clip and show its spectrogram underneath."""
    ipd.display(ipd.Audio(y, rate=sr))
    plt.figure(figsize=(11, 4))
    D = librosa.amplitude_to_db(np.abs(librosa.stft(y)), ref=np.max)
    librosa.display.specshow(D, sr=sr, x_axis="time", y_axis="hz", cmap="magma")
    if fmax:
        plt.ylim(0, fmax)
    plt.colorbar(format="%+2.0f dB")
    plt.title(title)
    plt.tight_layout()
    plt.show()
```

**How to read a spectrogram.** The **x-axis is time**, the **y-axis is frequency**, and **colour is loudness** (brighter = louder).

**The math.** The spectrogram is the squared magnitude of the **Short-Time Fourier Transform** — the signal is cut into overlapping frames, each multiplied by a window $w$, and Fourier-transformed:
$$\text{STFT}\{x\}(m,k)=\sum_{n} x[n]\,w[n-m]\,e^{-j2\pi kn/N},\qquad \text{spectrogram}=|\text{STFT}|^2 .$$
Horizontal stripes ⇒ steady tones; vertical streaks ⇒ sudden onsets; a fuzzy wash ⇒ noise.

---
# Part 1 — The Audio Gallery
We synthesize the first sounds (perfectly clean and reproducible), then bring in two *real* recordings from `librosa`.

```python
# --- synthesis helpers for the gallery ---

def pure_tone(freq=440, dur=2.0, sr=SR):
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    return 0.5 * np.sin(2 * np.pi * freq * t)

def two_tones(f1=440, f2=660, dur=2.0, sr=SR):
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    return 0.4 * (np.sin(2 * np.pi * f1 * t) + np.sin(2 * np.pi * f2 * t))

def chirp(f0=200, f1=8000, dur=3.0, sr=SR):
    """A tone that smoothly sweeps from f0 up to f1."""
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    return np.sin(2 * np.pi * (f0 * t + (f1 - f0) / (2 * dur) * t ** 2))

def percussion(dur=2.5, sr=SR):
    """A simple kick + snare pattern to demonstrate sharp transients."""
    n = int(dur * sr); y = np.zeros(n)
    def kick(t0):
        i = int(t0 * sr); L = int(0.18 * sr); tt = np.arange(L) / sr
        f = 110 * np.exp(-25 * tt)                      # pitch drops fast
        y[i:i+L] += np.sin(2*np.pi*np.cumsum(f)/sr) * np.exp(-18*tt)
    def snare(t0):
        i = int(t0 * sr); L = int(0.12 * sr); tt = np.arange(L) / sr
        y[i:i+L] += np.random.randn(L) * np.exp(-30*tt) * 0.7
    for b in range(4):
        kick(b*0.6); snare(b*0.6 + 0.3)
    return y / np.max(np.abs(y) + 1e-9)
```

### 1. Pure tone — 440 Hz (the note "A")
**Intuition.** The simplest sound: one steady frequency, a plain hum.

**The math.** A sampled sinusoid $x[n]=A\sin(2\pi f n/f_s+\varphi)$ has a spectrum that is a single line at $f$. **Look:** one flat horizontal line at 440 Hz.

```python
play_and_show(pure_tone(440), SR, "Pure tone (440 Hz)", fmax=4000)
```

### 2. Two tones together
**Intuition.** Add a second frequency (660 Hz) and the sound gets richer, chord-like.

**The math.** The Fourier transform is **linear**, so the spectrum of a sum is the sum of the spectra — here, *two* lines. This is the seed of the whole Fourier idea: any sound is a stack of simple tones.

```python
play_and_show(two_tones(440, 660), SR, "Two tones (440 + 660 Hz)", fmax=4000)
```

### 3. Chirp — a frequency sweep
**Intuition.** The pitch slides up from 200 Hz to 8 kHz — a rising "wheeee", a clean diagonal line.

**The math.** Instantaneous frequency is the derivative of phase. With phase $\phi(t)=2\pi\!\left(f_0 t+\tfrac{f_1-f_0}{2T}t^2\right)$,
$$f(t)=\frac{1}{2\pi}\frac{d\phi}{dt}=f_0+\frac{f_1-f_0}{T}\,t,$$
a straight line — hence "linear" chirp. This is the ideal signal for **aliasing**: by the **Nyquist limit**, anything above $f_s/2$ folds back to a *lower* frequency. Re-run with a smaller `sr` and watch the top of the sweep bend back down.

```python
play_and_show(chirp(200, 8000, 3.0), SR, "Linear chirp (200 Hz → 8 kHz)")
```

### 4. Percussion — kick & snare
**Intuition.** Thump, *tss*, thump, *tss* — the kicks are low blobs, the snares are tall broadband streaks.

**The math.** Percussion is dominated by **transients**. The time–frequency **uncertainty principle** ($\Delta t\,\Delta f \gtrsim \tfrac{1}{4\pi}$) says a sound that is sharp in *time* must be spread in *frequency* — which is why a snare hit smears energy across the whole band. This is exactly what **Zero-Crossing Rate** and **RMS energy** react to.

```python
play_and_show(percussion(), SR, "Percussion (kick + snare)", fmax=6000)
```

### 5. A real instrument — trumpet
**Intuition.** A real recording. Unlike our clean synthetic tones, it shows a whole *ladder* of evenly spaced lines plus a little breath noise.

**The math.** A sustained pitched instrument is **harmonic**: energy at integer multiples $f_k=k f_0$ of a fundamental $f_0$. The *relative heights* of those harmonics are what we hear as **timbre** — why a trumpet and a flute at the same pitch sound different.

```python
y_tr, sr_tr = librosa.load(librosa.example("trumpet"))
play_and_show(y_tr, sr_tr, "Trumpet (real recording)", fmax=8000)
```

### 6. Nature — birdsong
**Intuition.** A solo robin: rapid swooping curves high up, very unlike steady instrument stripes.

**The math.** Birdsong is **non-stationary** and strongly **frequency-modulated** — the dominant frequency moves so fast that a single Fourier transform of the whole clip would be meaningless; only a *time–frequency* view (the spectrogram) captures it.

*(If a download is blocked offline this cell will error — it works on Colab.)*

```python
y_bird, sr_bird = librosa.load(librosa.example("robin"))
play_and_show(y_bird, sr_bird, "Robin birdsong (real recording)", fmax=10000)
```

### 7. Singing voice
**Intuition.** A sustained "ahh" with a gentle wobble; a tall stack of harmonics, each one *wiggling*.

**The math.** That wiggle is **vibrato** — a slow frequency modulation of the fundamental, $F_0(t)=F_0\big(1+d\sin(2\pi f_{\text{vib}}t)\big)$. Each harmonic at $kF_0$ wiggles $k$ times as much, so the wobble grows toward the top of the spectrogram. Singing is just a *sustained, musical* version of the voiced speech we study next.

```python
def singing(dur=2.5, sr=SR, base=220):
    n = int(dur * sr); t = np.arange(n) / sr
    f0 = base * (1 + 0.03 * np.sin(2 * np.pi * 5.5 * t))   # 5.5 Hz vibrato
    phase = np.cumsum(f0) / sr
    y = sum(np.sin(2 * np.pi * k * phase) / k for k in range(1, 30))  # harmonics
    for f in [700, 1220, 2600]:                            # vowel "ah" formants
        r = np.exp(-np.pi * 90 / sr); th = 2 * np.pi * f / sr
        y = lfilter([1 - r], [1, -2*r*np.cos(th), r*r], y)
    env = np.minimum(1, np.minimum(t / 0.1, (dur - t) / 0.2))   # fade in/out
    return (y * env) / np.max(np.abs(y) + 1e-9)

play_and_show(singing(), SR, "Singing voice (vowel with vibrato)", fmax=4000)
```

---
# Part 2 — Speech: Voiced vs. Unvoiced, Male vs. Female

**Intuition.** Speech is a *buzz* or a *hiss* (the source) shaped by the tube of your mouth and throat (the filter).

**The math — the source-filter model.** Over a short frame, speech is the source $e[n]$ convolved with the vocal-tract response $v[n]$:
$$s[n]=(e*v)[n]\;\Longleftrightarrow\; S(e^{j\omega})=E(e^{j\omega})\,V(e^{j\omega}).$$
Only the **source** changes between the two classes:
- **Voiced** (vowels, "m", "z"): the folds buzz periodically → source is an impulse train → spectrum is a **comb of harmonics** at multiples of $F_0$, with $|V|$ shaping their envelope.
- **Unvoiced** (hisses "s", "f", "sh"): the source is **white noise** (flat spectrum) → output is just $|V|^2$ — broadband, no harmonic lines.

**Formants** are the resonances of $V$, built as 2-pole resonators — exactly what `vocal_tract()` implements:
$$H(z)=\frac{1-r}{1-2r\cos\theta\,z^{-1}+r^{2}z^{-2}},\qquad \theta=\frac{2\pi f_{\text{formant}}}{f_s}.$$

```python
def vocal_tract(x, formants, sr=SR, bw=90):
    """Colour a source signal with vocal-tract resonances (formants)."""
    for f in formants:
        r = np.exp(-np.pi * bw / sr); th = 2 * np.pi * f / sr
        x = lfilter([1 - r], [1, -2*r*np.cos(th), r*r], x)
    return x / (np.max(np.abs(x)) + 1e-9)

def voiced(f0, formants=(700, 1220, 2600), dur=1.2, sr=SR):
    n = int(dur * sr)
    src = np.zeros(n); src[::int(sr / f0)] = 1.0     # buzzing vocal folds
    return vocal_tract(src, formants, sr)

def unvoiced(formants=(1400, 4500), dur=1.2, sr=SR):
    src = np.random.randn(int(dur * sr)) * 0.3       # turbulent air = noise
    return vocal_tract(src, formants, sr)
```

### 2a. Voiced vs. unvoiced — *see* it and *hear* it

```python
v = voiced(150)        # a voiced vowel "ahh"
u = unvoiced()         # an unvoiced hiss "sss"

print("Voiced vowel (ahh):"); ipd.display(ipd.Audio(v, rate=SR))
print("Unvoiced hiss (sss):"); ipd.display(ipd.Audio(u, rate=SR))

fig, ax = plt.subplots(1, 2, figsize=(13, 4))
for a, sig, title, fmax in [(ax[0], v, "Voiced 'ahh' — harmonic bands", 4000),
                            (ax[1], u, "Unvoiced 'sss' — broadband noise", 8000)]:
    D = librosa.amplitude_to_db(np.abs(librosa.stft(sig)), ref=np.max)
    librosa.display.specshow(D, sr=SR, x_axis="time", y_axis="hz", ax=a, cmap="magma")
    a.set_ylim(0, fmax); a.set_title(title)
plt.tight_layout(); plt.show()
```

**Intuition.** Voiced = neat horizontal stripes (it has a pitch); unvoiced = a fuzzy wash (no pitch). Now confirm it with *numbers*.

**The math — zero-crossing rate.** Over a frame of $N$ samples,
$$\text{ZCR}=\frac{1}{2N}\sum_{n=1}^{N-1}\bigl|\operatorname{sgn}(x[n])-\operatorname{sgn}(x[n-1])\bigr|.$$
For energy near a single frequency $f$, $\ \text{ZCR}\approx 2f/f_s$. Unvoiced energy sits at high frequencies → many crossings → high ZCR. **RMS** $=\sqrt{\tfrac1N\sum x[n]^2}$ measures loudness; voiced sounds usually carry more.

```python
def zcr_rms(sig, sr=SR):
    zcr = librosa.feature.zero_crossing_rate(sig)[0]
    rms = librosa.feature.rms(y=sig)[0]
    return zcr, rms

zv, rv = zcr_rms(v)
zu, ru = zcr_rms(u)

print(f"Voiced   -> mean ZCR = {zv.mean():.3f},  mean RMS = {rv.mean():.3f}")
print(f"Unvoiced -> mean ZCR = {zu.mean():.3f},  mean RMS = {ru.mean():.3f}")

plt.figure(figsize=(11, 4))
plt.plot(librosa.times_like(zv), zv, label="ZCR — voiced")
plt.plot(librosa.times_like(zu), zu, label="ZCR — unvoiced")
plt.xlabel("Time (s)"); plt.ylabel("Zero-Crossing Rate")
plt.title("Unvoiced sounds cross zero far more often"); plt.legend(); plt.grid(alpha=0.3)
plt.show()
```

The higher ZCR (and lower energy) of the hiss is enough to build a basic **voiced/unvoiced detector** — the kind used inside speech recognisers.

### 2b. Male vs. female voice
**Intuition.** Same vowel, different **pitch**: typically ~110–150 Hz (male) vs ~190–250 Hz (female). Watch the harmonic stripes spread apart as pitch rises.

**The math.** Harmonic spacing equals $F_0$, so higher pitch literally widens the gaps. There's also a *physical* effect: modeling the tract as a tube of length $L$ (closed at the glottis, open at the lips), its resonances fall at $f_k=(2k-1)\,c/4L$. A shorter (female-average) tract pushes the **formants** up by ~15–20% too — so both pitch *and* timbre shift.

```python
male   = voiced(120)   # lower pitch
female = voiced(220)   # higher pitch

print("Male-range voice (F0 ≈ 120 Hz):");   ipd.display(ipd.Audio(male, rate=SR))
print("Female-range voice (F0 ≈ 220 Hz):"); ipd.display(ipd.Audio(female, rate=SR))

fig, ax = plt.subplots(1, 2, figsize=(13, 4))
for a, sig, title in [(ax[0], male, "Male voice (F0 ≈ 120 Hz) — closely spaced harmonics"),
                      (ax[1], female, "Female voice (F0 ≈ 220 Hz) — widely spaced harmonics")]:
    D = librosa.amplitude_to_db(np.abs(librosa.stft(sig)), ref=np.max)
    librosa.display.specshow(D, sr=SR, x_axis="time", y_axis="hz", ax=a, cmap="magma")
    a.set_ylim(0, 3500); a.set_title(title)
plt.tight_layout(); plt.show()
```

We can *measure* the pitch directly with `librosa.pyin` (a probabilistic version of the YIN autocorrelation method) and confirm the two differ.

```python
def estimate_f0(sig, sr=SR):
    f0, voiced_flag, _ = librosa.pyin(sig, fmin=80, fmax=400, sr=sr)
    return np.nanmean(f0)

print(f"Estimated F0 (male-range):   {estimate_f0(male):.1f} Hz")
print(f"Estimated F0 (female-range): {estimate_f0(female):.1f} Hz")
```

---
# Part 3 — Record your own voice (Colab)

Run the cell below, then call `record_audio()`. Your browser asks for **microphone permission** — allow it, speak a few seconds, and we analyse *your* voice with the same tools.

Try it twice: a long **"aaah"** (voiced) and a long **"sssss"** (unvoiced), and compare the spectrograms and the ZCR/F0 numbers.

```python
# --- Colab microphone recording ---
from IPython.display import Javascript
from google.colab import output
from base64 import b64decode

_RECORD_JS = """
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function record(time) {
  const stream = await navigator.mediaDevices.getUserMedia({audio: true});
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = e => chunks.push(e.data);
  rec.start();
  await sleep(time);
  rec.stop();
  await new Promise(r => rec.onstop = r);
  stream.getTracks().forEach(t => t.stop());
  const blob = new Blob(chunks);
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  await new Promise(r => reader.onloadend = r);
  return reader.result;
}
"""

def record_audio(seconds=4):
    """Record `seconds` of audio from the mic and return (y, sr)."""
    display(Javascript(_RECORD_JS))
    data_uri = output.eval_js(f"record({int(seconds * 1000)})")
    binary = b64decode(data_uri.split(",")[1])
    with open("recording.webm", "wb") as f:
        f.write(binary)
    y, sr = librosa.load("recording.webm", sr=SR)   # ffmpeg (built into Colab) decodes webm
    return y, sr

print("Defined record_audio(). Run the next cell to record.")
```

```python
# Record ~4 seconds, then play it back, show its spectrogram, and estimate your pitch.
y_me, sr_me = record_audio(seconds=4)
play_and_show(y_me, sr_me, "Your recording")

z, r = zcr_rms(y_me, sr_me)
print(f"Your mean ZCR: {z.mean():.3f}   |   mean RMS: {r.mean():.3f}")
try:
    print(f"Your estimated pitch (F0): {estimate_f0(y_me, sr_me):.1f} Hz")
except Exception as e:
    print("Pitch estimate skipped:", e)
```

---
### What's next
Once this depth feels right, I'll **merge this into the main tutorial** and clean up the existing notebook (fix the *DCT vs DFT* label, the two cut-off cells, the typos, and swap Kaggle paths for these portable loaders). Then on to **Phase 2 — the web app**.
