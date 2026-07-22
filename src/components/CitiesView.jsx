import React, { useState } from "react";
import { MapPin, CheckCircle2, ArrowRight, Plus, RotateCcw, Archive } from "lucide-react";
import Button from "./ui/Button";
import { inputCls } from "./ui/Field";
import { BRAND_MAROON } from "../lib/theme";

function StatChip({ label, value, color }) {
  if (!value) return null;
  return (
    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${color}1F`, color }}>
      {value} {label}
    </span>
  );
}

function CityCard({ g, isActive, isCompleted, onSetActive, onMarkComplete, onReopen, onView, delay }) {
  const pct = g.total ? Math.round(((g.sent) / g.total) * 100) : 0;
  return (
    <div
      className={`surface p-5 animate-fade-slide-up transition-all duration-150 ${isActive ? "ring-2 ring-[#2F6F62]/30" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <button onClick={onView} className="flex items-center gap-2 text-left group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isCompleted ? "#F5F3EC" : "rgba(47,111,98,0.1)" }}>
            <MapPin size={16} style={{ color: isCompleted ? "#B8B2A0" : "#2F6F62" }} />
          </div>
          <div>
            <div className="font-serif text-lg text-[#12283C] group-hover:underline decoration-[#E4E0D5] underline-offset-4">{g.city}</div>
            <div className="text-[11px] text-[#8A8574] font-mono">{g.total} clinic{g.total === 1 ? "" : "s"}</div>
          </div>
        </button>
        {isActive && (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#2F6F62]/10 text-[#2F6F62] whitespace-nowrap">ACTIVE</span>
        )}
        {isCompleted && (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F5F3EC] text-[#B8B2A0] whitespace-nowrap">WRAPPED UP</span>
        )}
      </div>

      <div className="h-1.5 rounded-full bg-[#EEEAE0] overflow-hidden mb-3">
        <div className="h-full rounded-full bg-gradient-to-r from-[#3A8172] to-[#1F5C4E] transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <StatChip label="not started" value={g.notStarted} color="#9CA3AF" />
        <StatChip label="in progress" value={g.inProgress} color="#C99A3C" />
        <StatChip label="sent" value={g.sent} color="#8B6FB8" />
        <StatChip label="replied" value={g.replied} color="#2F6F62" />
        <StatChip label="won" value={g.won} color="#1F5C4E" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={onView}>
          View clinics <ArrowRight size={12} />
        </Button>
        <div className="flex items-center gap-1.5">
          {!isActive && (
            <Button variant="ghost" size="sm" onClick={onSetActive}>Set active</Button>
          )}
          {isCompleted ? (
            <Button variant="ghost" size="sm" onClick={onReopen}><RotateCcw size={12} /> Reopen</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onMarkComplete}><Archive size={12} /> Wrap up</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CitiesView({ cityGroups, activeCity, completedCities, onSetActiveCity, onMarkComplete, onReopenCity, onViewCity }) {
  const [newCity, setNewCity] = useState("");
  const active = cityGroups.filter((g) => !completedCities.includes(g.city));
  const completed = cityGroups.filter((g) => completedCities.includes(g.city));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#12283C]">Cities</h1>
        <p className="text-sm text-[#8A8574] mt-0.5">Work one market at a time — wrap one up, move to the next.</p>
      </div>

      <div className="surface p-4 sm:p-5 flex items-center gap-2.5 flex-wrap">
        <input
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          placeholder="Starting a new city? Type it here (e.g. Cedar Rapids, IA)…"
          className={`${inputCls} flex-1 min-w-[220px]`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newCity.trim()) { onSetActiveCity(newCity.trim()); setNewCity(""); }
          }}
        />
        <Button
          variant="primary"
          onClick={() => { if (newCity.trim()) { onSetActiveCity(newCity.trim()); setNewCity(""); } }}
          disabled={!newCity.trim()}
        >
          <Plus size={14} /> Set as active city
        </Button>
      </div>

      {active.length === 0 && completed.length === 0 && (
        <div className="surface p-8 text-center">
          <p className="text-sm font-medium text-[#6B6355]">No cities yet.</p>
          <p className="text-[13px] text-[#B8B2A0] mt-1">Add a clinic with a city, or set an active city above, to get started.</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((g, i) => (
            <CityCard
              key={g.city}
              g={g}
              delay={i * 40}
              isActive={g.city === activeCity}
              isCompleted={false}
              onSetActive={() => onSetActiveCity(g.city)}
              onMarkComplete={() => onMarkComplete(g.city)}
              onView={() => onViewCity(g.city)}
            />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#B8B2A0] mb-3">Wrapped up</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">
            {completed.map((g, i) => (
              <CityCard
                key={g.city}
                g={g}
                delay={i * 40}
                isActive={false}
                isCompleted
                onSetActive={() => onSetActiveCity(g.city)}
                onReopen={() => onReopenCity(g.city)}
                onView={() => onViewCity(g.city)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
