"use client";
import { useEffect, useRef, useState } from "react";
import { STEPS } from "@/lib/steps";
import { mountLegacyStep } from "@/lib/viz/legacy";
import Theory from "@/components/Theory";
import SpectrogramExample from "@/components/SpectrogramExample";
import GalleryExplorer from "@/components/GalleryExplorer";

export default function Learn() {
  const [idx, setIdx] = useState(0);
  const stageRef = useRef(null);
  const controlsRef = useRef(null);
  const step = STEPS[idx];

  useEffect(() => {
    if (step.kind === "legacy" && stageRef.current && controlsRef.current) {
      const cleanup = mountLegacyStep(step.viz, stageRef.current, controlsRef.current);
      return cleanup;
    }
  }, [idx, step.kind, step.viz]);

  useEffect(() => {
    function onKey(e) {
      if (["INPUT", "BUTTON", "TEXTAREA"].includes(e.target?.tagName)) return;
      if (e.key === "ArrowRight") setIdx((i) => Math.min(STEPS.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="learn">
      <div className="lp-progress">
        <div className="dots">
          {STEPS.map((s, j) => (
            <b key={j} title={s.short}
               className={j === idx ? "on" : j < idx ? "done" : ""}
               onClick={() => setIdx(j)} />
          ))}
        </div>
        <span className="counter">{String(idx + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}</span>
      </div>

      <div className="learn-body">
        <Theory step={step} />
        <div className={"learn-stage" + (step.kind === "legacy" ? "" : " padded")}>
          {step.kind === "legacy" ? (
            <>
              <div className="stagecanvas" ref={stageRef} />
              <div className="controls" ref={controlsRef} />
            </>
          ) : step.kind === "spectrogram" ? (
            <SpectrogramExample id="chirp" title="Chirp (example)" />
          ) : (
            <GalleryExplorer />
          )}
        </div>
      </div>

      <div className="learn-nav">
        <button className="navbtn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Back</button>
        <span className="steptitle">{step.short}</span>
        <button className="navbtn next" disabled={idx === STEPS.length - 1}
          onClick={() => setIdx(idx + 1)}>{idx === STEPS.length - 1 ? "Done ✓" : "Next →"}</button>
      </div>
    </div>
  );
}
