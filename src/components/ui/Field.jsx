import React from "react";

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-mono text-[#8A8574] uppercase tracking-wider">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-[#B8B2A0]">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full border border-[#E4E0D5] rounded-xl px-3 py-2 text-sm bg-white placeholder:text-[#B8B2A0] focus:outline-none focus:ring-4 focus:ring-[#2F6F62]/10 focus:border-[#2F6F62] transition-all duration-150";

export const textareaCls = inputCls + " resize-y";

export default Field;
