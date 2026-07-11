import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { DEFAULT_ANGLE_TYPES } from "../lib/constants";
import Select from "./ui/Select";

export default function AngleTypeSelect({ value, onChange, customTypes, onAddCustom }) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const allTypes = [...DEFAULT_ANGLE_TYPES, ...customTypes];

  if (adding) {
    return (
      <div className="flex gap-1.5">
        <input
          autoFocus
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          placeholder="New angle type…"
          className="w-full border border-[#2F6F62] rounded-xl px-3 py-2 text-sm bg-white placeholder:text-[#B8B2A0] focus:outline-none focus:ring-4 focus:ring-[#2F6F62]/10 transition-all duration-150"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newVal.trim()) { onAddCustom(newVal.trim()); onChange(newVal.trim()); setAdding(false); setNewVal(""); }
            if (e.key === "Escape") setAdding(false);
          }}
        />
        <button
          onClick={() => { if (newVal.trim()) { onAddCustom(newVal.trim()); onChange(newVal.trim()); } setAdding(false); setNewVal(""); }}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-[#2F6F62] text-white hover:bg-[#1F5C4E] transition-colors"
        >
          <Check size={14} />
        </button>
        <button
          onClick={() => setAdding(false)}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-[#E4E0D5] text-[#8A8574] hover:bg-[#F7F5EF] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <Select value={value} onChange={(e) => { if (e.target.value === "__add__") setAdding(true); else onChange(e.target.value); }}>
      <option value="">—</option>
      {allTypes.map((a) => <option key={a} value={a}>{a}</option>)}
      <option value="__add__">+ Add new angle type…</option>
    </Select>
  );
}
