import React, { useEffect } from "react";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#12283C]/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl p-6 animate-scale-in`}
        style={{ boxShadow: "0 20px 50px -12px rgba(18,40,60,0.35), 0 4px 12px rgba(18,40,60,0.15)" }}
        role="dialog"
        aria-modal="true"
      >
        {title && <h3 className="font-serif text-xl text-[#12283C] mb-3">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
