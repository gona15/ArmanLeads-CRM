import React from "react";

function Bone({ className = "" }) {
  return <div className={`rounded-lg bg-[#E4E0D5]/70 animate-pulse ${className}`} />;
}

// Shown while the initial Supabase fetch is in flight — mirrors the
// dashboard's actual layout (sidebar, KPI row, queue cards) instead of a
// generic spinner, so the app feels like it's arriving, not just loading.
export default function SkeletonScreen() {
  return (
    <div className="min-h-screen bg-[#F5F3EC]">
      <aside className="hidden md:block md:w-64 md:fixed md:inset-y-0 md:left-0 border-r border-[#E4E0D5] bg-white/70 p-5">
        <div className="flex items-center gap-2.5 mb-8">
          <Bone className="w-9 h-9 rounded-xl" />
          <Bone className="w-24 h-4" />
        </div>
        <Bone className="w-full h-10 rounded-xl mb-2" />
        <Bone className="w-full h-9 rounded-xl mb-6" />
        <div className="space-y-2">
          <Bone className="w-full h-8" />
          <Bone className="w-full h-8" />
          <Bone className="w-full h-8" />
          <Bone className="w-full h-8" />
        </div>
      </aside>

      <main className="md:pl-64 px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Bone className="w-56 h-8" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[0, 1, 2, 3].map((i) => <Bone key={i} className="h-24" />)}
          </div>

          <Bone className="h-28" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <Bone key={i} className="h-48" />)}
          </div>
        </div>
      </main>
    </div>
  );
}
