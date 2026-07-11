import React from "react";
import { Search, MapPin, ChevronRight, Building2, Plus } from "lucide-react";
import Select from "./ui/Select";
import StatusBadge from "./ui/StatusBadge";
import AssigneeAvatar from "./ui/AssigneeAvatar";
import Avatar from "./ui/Avatar";
import EmptyState from "./ui/EmptyState";
import Button from "./ui/Button";
import { STATUSES, ASSIGNEES } from "../lib/constants";
import { colorForSeed } from "../lib/theme";

export default function LeadsList({
  leads,
  filtered,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  assigneeFilter,
  setAssigneeFilter,
  onSelectLead,
  onAddLead,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#12283C]">All Clinics</h1>
          <p className="text-sm text-[#8A8574] mt-0.5">
            {filtered.length} of {leads.length} clinics{filtered.length !== leads.length ? " match your filters" : ""}
          </p>
        </div>
        <Button variant="primary" onClick={onAddLead} className="hidden sm:inline-flex">
          <Plus size={15} /> New Clinic
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex items-center gap-2 bg-white border border-[#E4E0D5] rounded-xl px-3.5 py-2.5 flex-1 min-w-[200px] focus-within:ring-4 focus-within:ring-[#2F6F62]/10 focus-within:border-[#2F6F62] transition-all">
          <Search size={15} className="text-[#B8B2A0] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clinic or city…"
            className="outline-none text-sm w-full bg-transparent placeholder:text-[#B8B2A0]"
          />
        </div>
        <div className="flex gap-2.5">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="!w-auto min-w-[136px]">
            <option>All</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="!w-auto min-w-[110px]">
            <option>All</option>
            {ASSIGNEES.map((a) => <option key={a}>{a}</option>)}
          </Select>
        </div>
      </div>

      <div className="surface overflow-hidden">
        {filtered.length === 0 && (
          <EmptyState
            icon={Building2}
            title="No clinics match"
            message="Try adjusting your search or filters, or add a new clinic to get started."
          />
        )}
        <div className="divide-y divide-[#EEEAE0]">
          {filtered.map((l, i) => (
            <button
              key={l.id}
              onClick={() => onSelectLead(l.id)}
              style={{ animationDelay: `${Math.min(i, 14) * 25}ms` }}
              className="animate-fade-in w-full text-left flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-[#F7F5EF] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={l.name || "Unnamed"} color={colorForSeed(l.name || l.id)} size={38} className="hidden sm:flex" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#12283C] truncate">{l.name || "Unnamed clinic"}</div>
                  <div className="text-[11px] text-[#8A8574] flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">{l.city || "—"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <AssigneeAvatar name={l.assignedTo} size={24} className="hidden sm:inline-flex" />
                <StatusBadge status={l.status} />
                <ChevronRight size={15} className="text-[#B8B2A0] group-hover:translate-x-0.5 transition-transform hidden sm:block" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
