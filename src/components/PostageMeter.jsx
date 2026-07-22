import React from "react";
import { useCountUp } from "../lib/useCountUp";

// The signature element of the dashboard — kept the exact same circle math
// as the original (r=42, circumference-based stroke offset), just given a
// little more presence and a softer surrounding treatment.
export default function PostageMeter({ sentToday, goal }) {
  const displaySent = useCountUp(sentToday);
  const pct = Math.min(100, Math.round((sentToday / Math.max(1, goal)) * 100));
  const r = 42, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-[104px] h-[104px] shrink-0">
        <svg width="104" height="104" viewBox="0 0 100 100" className="-rotate-90 absolute inset-0">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#EEEAE0" strokeWidth="9" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke="url(#meterGradient)" strokeWidth="9"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
          />
          <defs>
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3A8172" />
              <stop offset="100%" stopColor="#1F5C4E" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-[#12283C] leading-none tabular-nums">{displaySent}</span>
          <span className="font-mono text-[9px] text-[#8A8574] tracking-wide mt-1">/ {goal} TODAY</span>
        </div>
      </div>
      <div>
        <div className="font-serif text-lg text-[#12283C] leading-tight">Daily Postage Meter</div>
        <div className="text-sm text-[#8A8574] mt-0.5">{pct}% of today's sending goal stamped &amp; sent</div>
      </div>
    </div>
  );
}
