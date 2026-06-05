"""Generate the curated gallery: synthesize each sound, compute its spectrogram with the
SAME code the live service uses, and write WAV + JSON + PNG + a manifest to ./gallery/.
Upload the gallery/ folder to a Supabase Storage bucket and the manifest rows to a table."""
import os, sys, json, base64
import numpy as np, soundfile as sf
from scipy.signal import lfilter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "spectro_service"))
from spectro import compute_spectrogram

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "gallery")
os.makedirs(OUT, exist_ok=True)
np.random.seed(0)

def _formants(x, fs, freqs, bw=90):
    for f in freqs:
        r = np.exp(-np.pi*bw/fs); th = 2*np.pi*f/fs
        x = lfilter([1-r], [1, -2*r*np.cos(th), r*r], x)
    return x/(np.max(np.abs(x))+1e-9)

def pure_tone(f=440, d=2.0): t=np.linspace(0,d,int(d*SR),endpoint=False); return 0.5*np.sin(2*np.pi*f*t)
def two_tones(d=2.0): t=np.linspace(0,d,int(d*SR),endpoint=False); return 0.4*(np.sin(2*np.pi*440*t)+np.sin(2*np.pi*660*t))
def chirp(d=3.0): t=np.linspace(0,d,int(d*SR),endpoint=False); return np.sin(2*np.pi*(200*t+(8000-200)/(2*d)*t**2))
def percussion(d=2.5):
    n=int(d*SR); y=np.zeros(n)
    for b in range(4):
        i=int(b*0.6*SR); L=int(0.18*SR); tt=np.arange(L)/SR
        y[i:i+L]+=np.sin(2*np.pi*np.cumsum(110*np.exp(-25*tt))/SR)*np.exp(-18*tt)
        i2=int((b*0.6+0.3)*SR); L2=int(0.12*SR); tt2=np.arange(L2)/SR
        y[i2:i2+L2]+=np.random.randn(L2)*np.exp(-30*tt2)*0.7
    return y/np.max(np.abs(y)+1e-9)
def voiced(f0, d=1.5):
    n=int(d*SR); src=np.zeros(n); src[::int(SR/f0)]=1.0; return _formants(src, SR, [700,1220,2600])
def unvoiced(d=1.5): return _formants(np.random.randn(int(d*SR))*0.3, SR, [1400,4500])
def singing(d=2.5, base=220):
    n=int(d*SR); t=np.arange(n)/SR; f0=base*(1+0.03*np.sin(2*np.pi*5.5*t)); ph=np.cumsum(f0)/SR
    y=sum(np.sin(2*np.pi*k*ph)/k for k in range(1,30))
    y=_formants(y, SR, [700,1220,2600]); env=np.minimum(1,np.minimum(t/0.1,(d-t)/0.2)); return (y*env)/np.max(np.abs(y)+1e-9)

GALLERY = [
    ("pure_tone","Pure tone (440 Hz)","music","One steady frequency — a single horizontal line.", pure_tone()),
    ("two_tones","Two tones","music","Two stacked frequencies — the seed of the Fourier idea.", two_tones()),
    ("chirp","Frequency sweep","synthetic","Pitch climbing 200 Hz to 8 kHz — a clean diagonal.", chirp()),
    ("percussion","Percussion","rhythm","Kicks (low blobs) and snares (broadband streaks) — transients.", percussion()),
    ("voiced","Voiced vowel (ahh)","speech","Vocal folds buzz — neat harmonic bands.", voiced(150)),
    ("unvoiced","Unvoiced hiss (sss)","speech","Turbulent noise — broadband, no harmonics.", unvoiced()),
    ("male_voice","Male voice (~120 Hz)","speech","Low pitch — closely spaced harmonics.", voiced(120)),
    ("female_voice","Female voice (~220 Hz)","speech","Higher pitch — widely spaced harmonics.", voiced(220)),
    ("singing","Singing voice","music","Sustained vowel with vibrato — wiggling harmonics.", singing()),
]

manifest=[]
for sid,title,cat,desc,y in GALLERY:
    y=y.astype(np.float32)
    sf.write(os.path.join(OUT, sid+".wav"), y, SR)
    spec=compute_spectrogram(y, SR)
    # standalone PNG file (from the data URL)
    png_b64=spec["png"].split(",",1)[1]
    open(os.path.join(OUT, sid+".png"),"wb").write(base64.b64decode(png_b64))
    rec={"id":sid,"title":title,"category":cat,"description":desc,
         "audio":sid+".wav","png":sid+".png","data":sid+".json","duration":spec["duration"]}
    # full data (matrix + meta) for interactive rendering
    json.dump({**rec, **{k:spec[k] for k in
              ["sr","duration","fmin","fmax","n_bins","n_frames","sec_per_frame","db_floor","matrix_b64"]}},
              open(os.path.join(OUT, sid+".json"),"w"))
    manifest.append(rec)

json.dump(manifest, open(os.path.join(OUT,"manifest.json"),"w"), indent=2)
print(f"wrote {len(manifest)} gallery items to {OUT}")
