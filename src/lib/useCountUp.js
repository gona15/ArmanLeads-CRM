import { useEffect, useRef, useState } from "react";

// Animates a number counting up to `value` whenever it changes — the
// small "alive" detail that separates a spreadsheet from a product.
// Skips the animation entirely for users who asked for reduced motion.
export function useCountUp(value, duration = 600) {
  const numeric = typeof value === "number" ? value : parseFloat(value);
  const isNumeric = !Number.isNaN(numeric);
  const [display, setDisplay] = useState(isNumeric ? numeric : value);
  const fromRef = useRef(isNumeric ? numeric : 0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isNumeric) { setDisplay(value); return; }

    const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { setDisplay(numeric); fromRef.current = numeric; return; }

    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(from + (numeric - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = numeric;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeric, isNumeric]);

  if (!isNumeric) return display;
  return Number.isInteger(numeric) ? Math.round(display) : display.toFixed(1);
}
