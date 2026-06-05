"use client";
import { useEffect, useState } from "react";
import SpectrogramView from "./SpectrogramView";

// Shows a bundled gallery sound's spectrogram with synced playback. No upload.
export default function SpectrogramExample({ id = "chirp", title }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`/gallery/${id}.json`).then((r) => r.json()).then(setData).catch(() => {});
  }, [id]);
  if (!data) return <div className="example-loading">Loading example…</div>;
  return <SpectrogramView data={data} audioUrl={`/gallery/${id}.wav`} title={title || id} />;
}
