"use client";
import { useEffect, useState } from "react";
import { loadGallery, loadSpectrogramData } from "@/lib/gallery";
import SpectrogramView from "./SpectrogramView";

export default function GalleryExplorer() {
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { loadGallery().then(setItems).catch((e) => setErr(e.message)); }, []);

  async function pick(it) {
    setSel(it); setData(null);
    try { setData(await loadSpectrogramData(it.dataUrl)); } catch (e) { setErr(e.message); }
  }

  return (
    <div className="gallery">
      {err ? <p className="err">⚠ {err}</p> : null}
      <div className="grid">
        {items.map((it) => (
          <button key={it.id} className={"tile" + (sel?.id === it.id ? " on" : "")} onClick={() => pick(it)}>
            <img src={it.pngUrl} alt={it.title} loading="lazy" />
            <div className="meta">
              <span className="cat">{it.category}</span>
              <strong>{it.title}</strong>
              <p>{it.description}</p>
            </div>
          </button>
        ))}
      </div>
      {sel && data ? <div className="result"><SpectrogramView data={data} audioUrl={sel.audioUrl} title={sel.title} /></div> : null}
    </div>
  );
}
