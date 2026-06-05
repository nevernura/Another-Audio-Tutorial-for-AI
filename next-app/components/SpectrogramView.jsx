"use client";
import { useEffect, useRef, useState } from "react";
import { LUT } from "./colormap";

// Decode base64 -> Uint8Array (browser)
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export default function SpectrogramView({ data, audioUrl, title }) {
  const canvasRef = useRef(null);
  const offRef = useRef(null);     // offscreen image at native matrix resolution
  const audioRef = useRef(null);
  const rafRef = useRef(0);
  const hoverRef = useRef(null);   // {x,y} in css px or null
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);

  // Build the offscreen image once per data change
  useEffect(() => {
    if (!data) return;
    const { matrix_b64, n_bins, n_frames } = data;
    const bytes = b64ToBytes(matrix_b64);          // length n_bins*n_frames, row0 = low freq
    const off = document.createElement("canvas");
    off.width = n_frames; off.height = n_bins;
    const octx = off.getContext("2d");
    const img = octx.createImageData(n_frames, n_bins);
    for (let r = 0; r < n_bins; r++) {
      const srcRow = (n_bins - 1 - r) * n_frames;  // flip: low freq -> bottom
      for (let x = 0; x < n_frames; x++) {
        const v = bytes[srcRow + x];
        const di = (r * n_frames + x) * 4, li = v * 3;
        img.data[di] = LUT[li]; img.data[di + 1] = LUT[li + 1];
        img.data[di + 2] = LUT[li + 2]; img.data[di + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    offRef.current = off;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // y (css px, 0=top) -> frequency, using the log axis fmin..fmax
  function yToFreq(yFrac) {
    const { fmin, fmax } = data;
    return Math.pow(fmin, yFrac) * Math.pow(fmax, 1 - yFrac); // yFrac=0 top->fmax
  }

  function draw() {
    const cv = canvasRef.current, off = offRef.current;
    if (!cv || !off || !data) return;
    const rect = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(rect.width * dpr));
    cv.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(off, 0, 0, off.width, off.height, 0, 0, cv.width, cv.height);

    // playhead
    const dur = data.duration || 1;
    const px = (cur / dur) * cv.width;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, cv.height); ctx.stroke();

    // hover crosshair + readout
    const h = hoverRef.current;
    if (h) {
      const hx = h.x * dpr, hy = h.y * dpr;
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1 * dpr;
      ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, cv.height);
      ctx.moveTo(0, hy); ctx.lineTo(cv.width, hy); ctx.stroke();
      const t = (h.x / rect.width) * dur;
      const f = yToFreq(h.y / rect.height);
      const label = `${t.toFixed(2)} s · ${f >= 1000 ? (f / 1000).toFixed(1) + " kHz" : Math.round(f) + " Hz"}`;
      ctx.font = `${12 * dpr}px "Spline Sans Mono", monospace`;
      const w = ctx.measureText(label).width + 14 * dpr;
      let bx = hx + 10 * dpr; if (bx + w > cv.width) bx = hx - 10 * dpr - w;
      ctx.fillStyle = "rgba(8,8,14,0.85)";
      ctx.fillRect(bx, hy - 24 * dpr, w, 20 * dpr);
      ctx.fillStyle = "#ffd8a8";
      ctx.fillText(label, bx + 7 * dpr, hy - 10 * dpr);
    }
  }

  // animation loop while playing (keeps playhead moving)
  useEffect(() => {
    function tick() {
      const a = audioRef.current;
      if (a) setCur(a.currentTime);
      draw();
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, cur, playing]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function toggle() {
    const a = audioRef.current; if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  }
  function seek(e) {
    const a = audioRef.current; if (!a || !data) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    a.currentTime = frac * (data.duration || 0);
    setCur(a.currentTime);
  }
  function move(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    hoverRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function leave() { hoverRef.current = null; }

  if (!data) return null;
  return (
    <div className="specwrap">
      <div className="axis-y" aria-hidden>
        {[20000, 5000, 1000, 200, 50].map((f) =>
          f < data.fmax ? <span key={f} style={{ top: `${freqTop(f, data) * 100}%` }}>
            {f >= 1000 ? f / 1000 + "k" : f}</span> : null)}
      </div>
      <div className="specstage">
        <canvas ref={canvasRef} className="spec" onClick={seek}
          onMouseMove={move} onMouseLeave={leave} />
        <div className="specbar">
          <button className="play" onClick={toggle}>{playing ? "❚❚ Pause" : "▶ Play"}</button>
          <span className="time">{cur.toFixed(2)} / {(data.duration || 0).toFixed(2)} s</span>
          {title ? <span className="spectitle">{title}</span> : null}
        </div>
        {audioUrl ? (
          <audio ref={audioRef} src={audioUrl} preload="auto"
            onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)} />
        ) : null}
      </div>
    </div>
  );
}

// fraction-from-top for an axis label freq on the log scale
function freqTop(f, data) {
  const { fmin, fmax } = data;
  const frac = Math.log(f / fmin) / Math.log(fmax / fmin); // 0 bottom -> 1 top
  return 1 - frac;
}
