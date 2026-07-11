import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Save, User, TrendingUp, Star, ChevronRight, Send, Building2 } from "lucide-react";
import PostageMeter from "./PostageMeter";
import StatusBadge from "./ui/StatusBadge";
import { STAGE_LABEL, STATUS_COLOR } from "../lib/constants";
import { hexToRgba } from "../lib/theme";

function KpiCard({ icon: Icon, label, value, accent, delay = 0 }) {
  return (
    <div className="surface p-4 sm:p-5 animate-fade-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#B8B2A0]">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: hexToRgba(accent, 0.12) }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
      </div>
      <div className="font-mono text-2xl sm:text-[28px] font-bold text-[#12283C] tabular-nums leading-none">{value}</div>
    </div>
  );
}

function QueueRow({ title, subtitle, right, onClick, delay = 0 }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-slide-up w-full text-left flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#F7F5EF] border border-transparent hover:border-[#EEEAE0] transition-colors"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-[#12283C] truncate">{title}</div>
        <div className="text-[11px] text-[#8A8574] font-mono truncate mt-0.5">{subtitle}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </button>
  );
}

function QueueCard({ icon: Icon, accent, title, count, emptyText, children }) {
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2" style={{ color: accent }}>
          <Icon size={16} />
          <h3 className="font-serif text-base text-[#12283C]">{title}</h3>
        </div>
        {count > 0 && (
          <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: hexToRgba(accent, 0.12), color: accent }}>
            {count}
          </span>
        )}
      </div>
      {count === 0 ? (
        <p className="text-sm text-[#B8B2A0] py-2">{emptyText}</p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto scroll-thin -mx-1 px-1">{children}</div>
      )}
    </div>
  );
}

export default function Dashboard({
  me,
  sentToday,
  dailyGoal,
  onGoalChange,
  followupsDue,
  draftsInProgress,
  myQueue,
  totalSentEmails,
  replyRate,
  convRate,
  totalLeads,
  statusCounts,
  angleStats,
  onSelectLead,
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#12283C]">{greeting}, {me}</h1>
        <p className="text-sm text-[#8A8574] mt-0.5">Here's where things stand today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={Send} label="Emails Sent" value={totalSentEmails} accent="#2F6F62" delay={0} />
        <KpiCard icon={TrendingUp} label="Reply Rate" value={`${replyRate}%`} accent="#5B8DB8" delay={40} />
        <KpiCard icon={Star} label="Conversion" value={`${convRate}%`} accent="#C99A3C" delay={80} />
        <KpiCard icon={Building2} label="Total Clinics" value={totalLeads} accent="#12283C" delay={120} />
      </div>

      <div className="surface p-5 sm:p-6 flex items-center justify-between flex-wrap gap-4">
        <PostageMeter sentToday={sentToday} goal={dailyGoal} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8A8574] font-mono uppercase tracking-wide">Daily Goal</span>
          <input
            type="number"
            value={dailyGoal}
            onChange={(e) => onGoalChange(Number(e.target.value) || 0)}
            className="w-16 border border-[#E4E0D5] rounded-lg px-2 py-1.5 font-mono text-sm text-center focus:outline-none focus:ring-4 focus:ring-[#2F6F62]/10 focus:border-[#2F6F62] transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <QueueCard icon={AlertTriangle} accent="#D2691E" title="Follow-ups Due" count={followupsDue.length} emptyText="Nothing due — clean queue.">
          {followupsDue.map(({ l, fu }, i) => (
            <QueueRow
              key={l.id}
              delay={i * 30}
              onClick={() => onSelectLead(l.id)}
              title={l.name || "Unnamed clinic"}
              subtitle={`${STAGE_LABEL[fu.dueStage]} · ${fu.daysOverdue > 0 ? `${fu.daysOverdue}d overdue` : "due today"}`}
              right={<ChevronRight size={14} className="text-[#B8B2A0]" />}
            />
          ))}
        </QueueCard>

        <QueueCard icon={Save} accent="#C99A3C" title="Drafts In Progress" count={draftsInProgress.length} emptyText="No unsent drafts sitting around.">
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

        <QueueCard icon={User} accent="#2F6F62" title={`${me}'s Queue`} count={myQueue.length} emptyText="Nothing assigned to you right now.">
          {myQueue.map((l, i) => (
            <QueueRow
              key={l.id}
              delay={i * 30}
              onClick={() => onSelectLead(l.id)}
              title={l.name || "Unnamed clinic"}
              subtitle={l.nextNote || l.status}
              right={<StatusBadge status={l.status} size="sm" />}
            />
          ))}
        </QueueCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface p-4 sm:p-5">
          <h3 className="font-serif text-base mb-3 flex items-center gap-2 text-[#12283C]"><TrendingUp size={16} className="text-[#2F6F62]" /> Pipeline Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusCounts} layout="vertical" margin={{ left: 10, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: "#8A8574" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(18,40,60,0.04)" }}
                contentStyle={{ borderRadius: 12, border: "1px solid #E4E0D5", fontSize: 12, boxShadow: "0 8px 24px rgba(18,40,60,0.12)" }}
                labelStyle={{ color: "#12283C", fontWeight: 600 }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {statusCounts.map((s, i) => <Cell key={i} fill={STATUS_COLOR[s.name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface p-4 sm:p-5">
          <h3 className="font-serif text-base mb-1 flex items-center gap-2 text-[#12283C]"><Star size={16} className="text-[#C99A3C]" /> SMYK Angle Performance</h3>
          <p className="text-[11px] text-[#8A8574] mb-2">Reply rate by personalization angle used.</p>
          {angleStats.length === 0 ? (
            <p className="text-sm text-[#B8B2A0] py-8 text-center">Tag angle types as you send to see this fill in.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={angleStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEAE0" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#8A8574" }} angle={-15} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8A8574" }} unit="%" axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v, n, p) => [`${v}% (n=${p.payload.count})`, "Reply rate"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #E4E0D5", fontSize: 12, boxShadow: "0 8px 24px rgba(18,40,60,0.12)" }}
                  labelStyle={{ color: "#12283C", fontWeight: 600 }}
                  cursor={{ fill: "rgba(18,40,60,0.04)" }}
                />
                <Bar dataKey="rate" fill="#2F6F62" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
