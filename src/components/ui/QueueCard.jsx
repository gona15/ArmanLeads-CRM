import React from "react";
import { hexToRgba } from "../../lib/theme";

// Shared by Dashboard and TodayView so both queues look and behave
// identically — extracted from Dashboard rather than duplicated.
export function QueueRow({ title, subtitle, right, onClick, delay = 0 }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-slide-up w-full text-left flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#F7F5EF] border border-transparent hover:border-[#EEEAE0] transition-colors"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-[#12283C] truncate">{title}</div>
        <div className="text-[11px] text-[#8A8574] font-mono truncate mt-0.5">{subtitle}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </button>
  );
}

export function QueueCard({ icon: Icon, accent, title, count, emptyText, children }) {
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2" style={{ color: accent }}>
          <Icon size={16} />
          <h3 className="font-serif text-base text-[#12283C]">{title}</h3>
        </div>
        {count > 0 && (
          <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: hexToRgba(accent, 0.12), color: accent }}>
            {count}
          </span>
        )}
      </div>
      {count === 0 ? (
        <p className="text-sm text-[#B8B2A0] py-2">{emptyText}</p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto scroll-thin -mx-1 px-1">{children}</div>
      )}
    </div>
  );
}
