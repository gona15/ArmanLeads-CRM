import React from "react";
import { LayoutDashboard, Building2, Plus, Mail, Sunrise } from "lucide-react";
import AssigneeAvatar from "./ui/AssigneeAvatar";

export function MobileTopBar({ me, saving, onSwitchIdentity }) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-[#E4E0D5] pt-safe">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center shrink-0">
            <Mail size={15} className="text-white" />
          </div>
          <span className="font-serif text-[16px] text-[#12283C]">ArmanLeads</span>
        </div>
        <button
          onClick={onSwitchIdentity}
          className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-full active:bg-[#12283C]/5 transition-colors"
        >
          <AssigneeAvatar name={me} size={26} />
          <span className="text-[13px] font-medium text-[#12283C]">{me}</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${saving ? "bg-[#C99A3C] animate-pulse-dot" : "bg-[#2F6F62]"}`}
          />
        </button>
      </div>
    </header>
  );
}

export function MobileBottomBar({ view, setView, onAddLead }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-t border-[#E4E0D5] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => setView("dashboard")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${view === "dashboard" ? "text-[#12283C]" : "text-[#B8B2A0]"}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => setView("today")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${view === "today" ? "text-[#12283C]" : "text-[#B8B2A0]"}`}
        >
          <Sunrise size={20} />
          <span className="text-[10px] font-medium">Today</span>
        </button>

        <button
          onClick={onAddLead}
          aria-label="New Clinic"
          className="w-14 h-14 -mt-8 rounded-full bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] text-white flex items-center justify-center shadow-[0_6px_16px_rgba(47,111,98,0.4)] active:scale-95 transition-transform border-4 border-[#F5F3EC] shrink-0"
        >
          <Plus size={24} />
        </button>

        <button
          onClick={() => setView("list")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${view === "list" ? "text-[#12283C]" : "text-[#B8B2A0]"}`}
        >
          <Building2 size={20} />
          <span className="text-[10px] font-medium">Clinics</span>
        </button>
      </div>
    </nav>
  );
}
