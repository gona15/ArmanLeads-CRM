import React from "react";
import { LayoutDashboard, Building2, Plus, Mail, Sunrise, MapPin, Search } from "lucide-react";
import AssigneeAvatar from "./ui/AssigneeAvatar";

export function MobileTopBar({ me, saving, onSwitchIdentity, onOpenSearch }) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-[#E4E0D5] pt-safe">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center shrink-0">
            <Mail size={15} className="text-white" />
          </div>
          <span className="font-serif text-[16px] text-[#12283C]">ArmanLeads</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onOpenSearch} aria-label="Quick search" className="w-9 h-9 flex items-center justify-center rounded-full active:bg-[#12283C]/5 transition-colors text-[#6B6355]">
            <Search size={17} />
          </button>
          <button
            onClick={onSwitchIdentity}
            className="flex items-center gap-1.5 pl-1 pr-2.5 py-1.5 rounded-full active:bg-[#12283C]/5 transition-colors"
          >
            <AssigneeAvatar name={me} size={26} />
            <span
              className={`w-1.5 h-1.5 rounded-full ${saving ? "bg-[#C99A3C] animate-pulse-dot" : "bg-[#2F6F62]"}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileBottomBar({ view, setView, onAddLead }) {
  const tab = (key, label, Icon) => (
    <button
      onClick={() => setView(key)}
      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${view === key ? "text-[#12283C]" : "text-[#B8B2A0]"}`}
    >
      <Icon size={19} />
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-t border-[#E4E0D5] pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {tab("dashboard", "Home", LayoutDashboard)}
        {tab("today", "Today", Sunrise)}

        <button
          onClick={onAddLead}
          aria-label="New Clinic"
          className="w-14 h-14 -mt-8 rounded-full bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] text-white flex items-center justify-center shadow-[0_6px_16px_rgba(47,111,98,0.4)] active:scale-95 transition-transform border-4 border-[#F5F3EC] shrink-0"
        >
          <Plus size={24} />
        </button>

        {tab("cities", "Cities", MapPin)}
        {tab("list", "Clinics", Building2)}
      </div>
    </nav>
  );
}
