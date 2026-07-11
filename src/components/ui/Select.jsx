import React from "react";
import { ChevronDown } from "lucide-react";

export default function Select({ className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        className={`w-full appearance-none border border-[#E4E0D5] rounded-xl pl-3 pr-9 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#2F6F62]/10 focus:border-[#2F6F62] transition-all duration-150 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B2A0]" />
    </div>
  );
}
