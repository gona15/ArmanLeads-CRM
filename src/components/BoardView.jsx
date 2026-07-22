import React, { useState } from "react";
import { MapPin, Clock } from "lucide-react";
import AssigneeAvatar from "./ui/AssigneeAvatar";
import { STATUSES, STATUS_COLOR, computeFollowupState } from "../lib/constants";
import { hexToRgba, BRAND_MAROON } from "../lib/theme";

function Card({ lead, onSelect }) {
  const [dragging, setDragging] = useState(false);
  const fu = computeFollowupState(lead);
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", lead.id); e.dataTransfer.effectAllowed = "move"; setDragging(true); }}
      onDragEnd={() => setDragging(false)}
      onClick={() => onSelect(lead.id)}
      className={`surface p-3 cursor-grab active:cursor-grabbing hover:shadow-[0_4px_16px_rgba(18,40,60,0.1)] transition-all duration-150 ${dragging ? "opacity-40 scale-95" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-sm font-medium text-[#12283C] leading-snug">{lead.name || "Unnamed clinic"}</div>
        <AssigneeAvatar name={lead.assignedTo} size={20} className="shrink-0" />
      </div>
      <div className="flex items-center gap-1 text-[11px] text-[#8A8574] mb-1.5">
        <MapPin size={10} className="shrink-0" />
        <span className="truncate">{lead.city || "—"}</span>
      </div>
      {fu && (
        <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: fu.daysOverdue > 0 ? BRAND_MAROON : "#D2691E" }}>
          <Clock size={10} />
          {fu.daysOverdue > 0 ? `${fu.daysOverdue}d overdue` : "due today"}
        </div>
      )}
    </div>
  );
}

function Column({ status, leads, onSelect, onDropLead }) {
  const [dragOver, setDragOver] = useState(false);
  const color = STATUS_COLOR[status];
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDropLead(id, status);
      }}
      className={`w-72 shrink-0 rounded-2xl p-2.5 transition-colors duration-150 ${dragOver ? "bg-[#2F6F62]/8" : "bg-[#EEEAE0]/40"}`}
    >
      <div className="flex items-center justify-between px-1.5 py-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[12px] font-semibold text-[#12283C]">{status}</span>
        </div>
        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: hexToRgba(color, 0.14), color }}>
          {leads.length}
        </span>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto scroll-thin px-0.5 pb-2 min-h-[60px]">
        {leads.map((l) => <Card key={l.id} lead={l} onSelect={onSelect} />)}
        {leads.length === 0 && <div className="text-[11px] text-[#B8B2A0] text-center py-6 border border-dashed border-[#E4E0D5] rounded-xl">Drop here</div>}
      </div>
    </div>
  );
}

// Drag-and-drop pipeline board — an alternative to the list for working
// the whole pipeline at a glance. Dropping a card on a column changes
// that lead's status the same way the dropdown in Lead Detail does.
export default function BoardView({ leads, onSelectLead, onDropLead }) {
  return (
    <div className="flex gap-3 overflow-x-auto scroll-thin pb-3 -mx-1 px-1">
      {STATUSES.map((status) => (
        <Column
          key={status}
          status={status}
          leads={leads.filter((l) => l.status === status)}
          onSelect={onSelectLead}
          onDropLead={onDropLead}
        />
      ))}
    </div>
  );
}
