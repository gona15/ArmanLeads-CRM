import React, { useEffect, useState, useMemo } from "react";

const COLORS = ["#2F6F62", "#C99A3C", "#7A1F2B", "#5B8DB8", "#1F5C4E"];

function makePieces(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    left: 40 + Math.random() * 20, // vw-ish spread, centered
    delay: Math.random() * 150,
    duration: 900 + Math.random() * 700,
    drift: (Math.random() - 0.5) * 160,
    rotate: Math.random() * 720 - 360,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 5,
  }));
}

// A tasteful, brief celebration burst — not a gimmick that overstays its
// welcome. Fires once per `burstKey` change, cleans itself up.
export default function Confetti({ burstKey }) {
  const [active, setActive] = useState(false);
  const pieces = useMemo(() => makePieces(24), [burstKey]);

  useEffect(() => {
    if (!burstKey) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    setActive(true);
    const t = setTimeout(() => setActive(false), 1800);
    return () => clearTimeout(t);
  }, [burstKey]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-1/3 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}ms ease-in ${p.delay}ms forwards`,
            "--drift": `${p.drift}px`,
            "--rotate": `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
