import React, { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

// Single active toast, bottom-center. Deliberately simple — one at a
// time, auto-dismisses, optional action button (used for delete-undo).
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, toast.duration || 6000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fade-slide-up">
      <div
        className="flex items-center gap-3 bg-[#12283C] text-white rounded-2xl pl-4 pr-2 py-2.5 max-w-[92vw]"
        style={{ boxShadow: "0 20px 40px -12px rgba(18,40,60,0.5)" }}
      >
        <CheckCircle2 size={16} className="text-[#3A8172] shrink-0" />
        <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">{toast.message}</span>
        {toast.actionLabel && (
          <button
            onClick={() => { toast.onAction?.(); onDismiss(); }}
            className="text-sm font-semibold text-[#8FD9C4] hover:text-white px-2 py-1 rounded-lg transition-colors shrink-0"
          >
            {toast.actionLabel}
          </button>
        )}
        <button onClick={onDismiss} className="text-white/50 hover:text-white transition-colors shrink-0 p-1">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
