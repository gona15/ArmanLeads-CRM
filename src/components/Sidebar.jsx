import React from "react";
import { LayoutDashboard, Building2, Plus, Mail, LogOut, Sunrise } from "lucide-react";
import AssigneeAvatar from "./ui/AssigneeAvatar";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "today", label: "Today", icon: Sunrise },
  { key: "list", label: "All Clinics", icon: Building2 },
];

export default function Sidebar({ view, setView, onAddLead, me, saving, onSwitchIdentity }) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 border-r border-[#E4E0D5] bg-white/70 backdrop-blur-md z-20">
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center shadow-[0_2px_8px_rgba(47,111,98,0.35)]">
          <Mail size={17} className="text-white" />
        </div>
        <div className="leading-none">
          <div className="font-serif text-[17px] text-[#12283C]">ArmanLeads</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#B8B2A0] mt-1">Ledger</div>
        </div>
      </div>

      <div className="px-3">
        <button
          onClick={onAddLead}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#2F6F62] text-white text-sm font-medium py-2.5 hover:bg-[#1F5C4E] active:scale-[0.98] transition-all duration-150 shadow-[0_2px_6px_rgba(47,111,98,0.25)]"
        >
          <Plus size={15} /> New Clinic
        </button>
      </div>

      <nav className="flex-1 px-3 mt-5 space-y-0.5">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = view === key;
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-[#12283C] text-white" : "text-[#6B6355] hover:bg-[#12283C]/5 hover:text-[#12283C]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#E4E0D5]">
        <button
          onClick={onSwitchIdentity}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#12283C]/5 transition-colors group"
        >
          <AssigneeAvatar name={me} size={30} />
          <div className="flex-1 text-left leading-tight min-w-0">
            <div className="text-sm font-medium text-[#12283C] truncate">{me}</div>
            <div className="text-[11px] text-[#B8B2A0] font-mono flex items-center gap-1.5">
              {saving ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C99A3C] animate-pulse-dot" /> saving…
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F6F62]" /> synced
                </>
              )}
            </div>
          </div>
          <LogOut size={14} className="text-[#B8B2A0] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      </div>
    </aside>
  );
}
