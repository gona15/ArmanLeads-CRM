import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, MapPin, CornerDownLeft, X } from "lucide-react";
import StatusBadge from "./ui/StatusBadge";
import Avatar from "./ui/Avatar";
import { colorForSeed } from "../lib/theme";

// Cmd/Ctrl+K instant lookup — the direct answer to "have I already
// contacted this dental/doctor?" Searches name, city, and owner across
// every lead, not just the currently-filtered list.
export default function QuickSearch({ open, onClose, leads, onSelectLead }) {
  const [q, setQ] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return leads.slice(0, 8);
    return leads
      .filter((l) => (l.name || "").toLowerCase().includes(term) || (l.city || "").toLowerCase().includes(term) || (l.ownerName || "").toLowerCase().includes(term))
      .slice(0, 8);
  }, [q, leads]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
      if (e.key === "Enter" && results[highlight]) { onSelectLead(results[highlight].id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, highlight, onClose, onSelectLead]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-[#12283C]/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden animate-scale-in"
        style={{ boxShadow: "0 20px 50px -12px rgba(18,40,60,0.35), 0 4px 12px rgba(18,40,60,0.15)" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#EEEAE0]">
          <Search size={17} className="text-[#B8B2A0] shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setHighlight(0); }}
            placeholder="Have I already done this one? Search by name, city, or owner…"
            className="flex-1 outline-none text-sm bg-transparent placeholder:text-[#B8B2A0]"
          />
          <button onClick={onClose} className="text-[#B8B2A0] hover:text-[#12283C] transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto scroll-thin">
          {results.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-[#6B6355]">No match — this one's new.</p>
              <p className="text-[13px] text-[#B8B2A0] mt-1">Nothing in the ledger by that name, city, or owner.</p>
            </div>
          ) : (
            results.map((l, i) => (
              <button
                key={l.id}
                onClick={() => onSelectLead(l.id)}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 transition-colors ${i === highlight ? "bg-[#F7F5EF]" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={l.name || "Unnamed"} color={colorForSeed(l.name || l.id)} size={32} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#12283C] truncate">{l.name || "Unnamed clinic"}</div>
                    <div className="text-[11px] text-[#8A8574] flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="shrink-0" />
                      <span className="truncate">{l.city || "—"}{l.ownerName ? ` · ${l.ownerName}` : ""}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={l.status} size="sm" />
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[#EEEAE0] text-[10px] font-mono text-[#B8B2A0]">
          <span className="flex items-center gap-1"><CornerDownLeft size={11} /> select</span>
          <span>↑↓ navigate</span>
          <span>esc close</span>
          <span className="ml-auto">{leads.length} total clinics</span>
        </div>
      </div>
    </div>
  );
}
