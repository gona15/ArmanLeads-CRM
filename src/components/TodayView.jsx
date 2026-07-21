import React from "react";
import { AlertTriangle, Save, Sparkles, ChevronRight } from "lucide-react";
import { QueueCard, QueueRow } from "./ui/QueueCard";
import { STAGE_LABEL } from "../lib/constants";
import { BRAND_MAROON } from "../lib/theme";

// One-screen daily triage: everything that needs a human decision today,
// nothing that doesn't. Same underlying data the Dashboard already
// computes (followupsDue, draftsInProgress) plus what's brand new.
export default function TodayView({ followupsDue, draftsInProgress, recentlyAdded, onSelectLead }) {
  const anyOverdue = followupsDue.some((x) => x.fu.daysOverdue > 0);
  const nothingToDo = followupsDue.length === 0 && draftsInProgress.length === 0 && recentlyAdded.length === 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#12283C]">Today</h1>
        <p className="text-sm text-[#8A8574] mt-0.5">Everything that needs you right now — nothing else.</p>
      </div>

      {nothingToDo && (
        <div className="surface p-8 text-center">
          <p className="text-sm font-medium text-[#6B6355]">Clean slate.</p>
          <p className="text-[13px] text-[#B8B2A0] mt-1">No overdue follow-ups, no unfinished drafts, nothing new today.</p>
        </div>
      )}

      {!nothingToDo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <QueueCard
            icon={AlertTriangle}
            accent={anyOverdue ? BRAND_MAROON : "#D2691E"}
            title="Follow-ups Due"
            count={followupsDue.length}
            emptyText="Nothing due today."
          >
            {followupsDue.map(({ l, fu }, i) => (
              <QueueRow
                key={l.id}
                delay={i * 30}
                onClick={() => onSelectLead(l.id)}
                title={l.name || "Unnamed clinic"}
                subtitle={`${STAGE_LABEL[fu.dueStage]} · ${fu.daysOverdue > 0 ? `${fu.daysOverdue}d overdue` : "due today"}`}
                right={
                  fu.daysOverdue > 0 ? (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: BRAND_MAROON }} title="Overdue" />
                  ) : (
                    <ChevronRight size={14} className="text-[#B8B2A0]" />
                  )
                }
              />
            ))}
          </QueueCard>

          <QueueCard icon={Save} accent="#C99A3C" title="Unfinished Drafts" count={draftsInProgress.length} emptyText="No unsent drafts sitting around.">
            {draftsInProgress.map((l, i) => (
              <QueueRow
                key={l.id}
                delay={i * 30}
                onClick={() => onSelectLead(l.id)}
                title={l.name || "Unnamed clinic"}
                subtitle={l.assignedTo}
                right={<ChevronRight size={14} className="text-[#B8B2A0]" />}
              />
            ))}
          </QueueCard>

          <QueueCard icon={Sparkles} accent="#2F6F62" title="Added Today" count={recentlyAdded.length} emptyText="Nothing new yet today.">
            {recentlyAdded.map((l, i) => (
              <QueueRow
                key={l.id}
                delay={i * 30}
                onClick={() => onSelectLead(l.id)}
                title={l.name || "Unnamed clinic"}
                subtitle={l.status}
                right={<ChevronRight size={14} className="text-[#B8B2A0]" />}
              />
            ))}
          </QueueCard>
        </div>
      )}
    </div>
  );
}
