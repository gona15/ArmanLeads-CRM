import React, { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { US_CITIES } from "../citiesData";
import { inputCls } from "./ui/Field";

export default function CityAutocomplete({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const matches = query.trim().length > 0
    ? US_CITIES.filter((c) => c.toLowerCase().startsWith(query.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="relative" ref={wrapRef}>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="City, State"
        className={inputCls}
      />
      {open && matches.length > 0 && (
        <div
          className="absolute z-20 mt-1.5 w-full bg-white border border-[#E4E0D5] rounded-xl overflow-hidden max-h-48 overflow-y-auto scroll-thin animate-fade-in"
          style={{ boxShadow: "0 12px 28px -8px rgba(18,40,60,0.18)" }}
        >
          {matches.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { onChange(m); setQuery(m); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#F7F5EF] flex items-center gap-2 transition-colors"
            >
              <MapPin size={11} className="text-[#B8B2A0] shrink-0" />
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
