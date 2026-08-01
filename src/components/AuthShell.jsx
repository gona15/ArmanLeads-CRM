import React from "react";

// Shared full-bleed shell for every pre-app screen (Supabase sign-in, set
// password, and the identity picker) — deliberately different from the
// light cream app shell behind it: a dark, cinematic entry that gives way
// to the light workspace once you're actually in, rather than one flat
// look throughout. Same brand palette as the rest of the app, just given
// real room to be dramatic in the one place that's purely a threshold.
export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12 overflow-hidden bg-[#0D1B29]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="animate-mesh-drift absolute -top-[20%] -left-[15%] w-[65vw] h-[65vw] max-w-[700px] max-h-[700px] rounded-full opacity-40"
          style={{ background: "#2F6F62", filter: "blur(100px)" }}
        />
        <div
          className="animate-mesh-drift absolute top-[15%] -right-[20%] w-[60vw] h-[60vw] max-w-[650px] max-h-[650px] rounded-full opacity-[0.32]"
          style={{ background: "#7A1F2B", filter: "blur(100px)", animationDelay: "-6s" }}
        />
        <div
          className="animate-mesh-drift absolute -bottom-[25%] left-[8%] w-[55vw] h-[55vw] max-w-[600px] max-h-[600px] rounded-full opacity-[0.22]"
          style={{ background: "#C99A3C", filter: "blur(100px)", animationDelay: "-12s" }}
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 0%, rgba(13,27,41,0.4) 60%, #0D1B29 100%)" }} />
      </div>

      <div className="relative w-full max-w-[400px] animate-spring-in">
        <div className="text-center mb-8 sm:mb-10">
          <div className="font-serif text-5xl sm:text-6xl text-white leading-none tracking-tight">
            Arman<span className="italic font-normal">Leads</span>
          </div>
          <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-white/40 mt-3">Ledger</div>
        </div>
        {children}
      </div>
    </div>
  );
}

export const glassCard = "bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-[28px] p-7 sm:p-8";
export const glassCardShadow = { boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)" };
export const glassInput =
  "w-full bg-white/[0.05] border border-white/[0.14] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 text-center focus:outline-none focus:ring-4 focus:ring-[#3A8172]/25 focus:border-[#3A8172]/60 transition-all duration-150";
export const glassButton =
  "w-full bg-[#2F6F62] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#3A8172] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 shadow-[0_4px_20px_rgba(47,111,98,0.4)]";
