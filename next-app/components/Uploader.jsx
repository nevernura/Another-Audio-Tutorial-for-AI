"use client";
import { useEffect, useState } from "react";
import SpectrogramView from "./SpectrogramView";
import { loadSpectrogramData } from "@/lib/gallery";

export default function Uploader({ initialExample }) {
  const [data, setData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!initialExample) return;
    loadSpectrogramData(`/gallery/${initialExample}.json`)
      .then((d) => { setData(d); setAudioUrl(`/gallery/${initialExample}.wav`); setName(initialExample + " (example)"); })
      .catch(() => {});
  }, [initialExample]);

  async function handleFile(file) {
    if (!file) return;
    setErr(""); setBusy(true);
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch("/api/spectrogram", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "failed");
      setData(json); setAudioUrl(URL.createObjectURL(file)); setName(file.name);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="uploader">
      <label className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
        <input type="file" accept="audio/*" hidden onChange={(e) => handleFile(e.target.files[0])} />
        <span>{busy ? "Analyzing…" : "Click or drop an audio file (needs the librosa service running)"}</span>
      </label>
      {err ? <p className="err">⚠ {err}</p> : null}
      {data ? <div className="result"><SpectrogramView data={data} audioUrl={audioUrl} title={name} /></div> : null}
    </div>
  );
}
