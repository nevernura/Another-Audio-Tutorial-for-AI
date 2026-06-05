"use client";
import { useEffect, useRef, useState } from "react";

export default function Theory({ step }) {
  const [open, setOpen] = useState(false);
  const mathRef = useRef(null);

  useEffect(() => { setOpen(false); }, [step]);
  useEffect(() => {
    if (open && mathRef.current && typeof window !== "undefined" && window.renderMathInElement) {
      window.renderMathInElement(mathRef.current, {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
      });
    }
  }, [open, step]);

  return (
    <div className="lesson-card" key={step.title}>
      <div className="kicker">{step.kicker}</div>
      <h2>{step.title}</h2>
      <p className="intuition" dangerouslySetInnerHTML={{ __html: step.intuition }} />
      {step.takeaway ? <div className="takeaway" dangerouslySetInnerHTML={{ __html: step.takeaway }} /> : null}
      {step.chips?.length ? (
        <div className="chips">{step.chips.map((c) => <span className="chip" key={c}>{c}</span>)}</div>
      ) : null}
      <div className="mathwrap">
        <button className={"mathtoggle" + (open ? " open" : "")} onClick={() => setOpen((o) => !o)}>
          <span className="chev">▶</span> {open ? "Hide" : "Show"} the math
        </button>
        {open ? <div className="mathbody open" ref={mathRef} dangerouslySetInnerHTML={{ __html: step.math }} /> : null}
      </div>
    </div>
  );
}
