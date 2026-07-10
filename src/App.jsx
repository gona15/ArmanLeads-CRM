import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Mail, Search, Plus, ChevronRight, Clock, CheckCircle2, AlertTriangle,
  TrendingUp, Send, Star, MapPin, User, ArrowLeft, Save,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "./supabaseClient";

// ---------- constants ----------
const ROW_ID = "main";
const TABLE = "armanleads_state";

const STAGES = ["initial", "fu1", "fu2", "fu3"];
const STAGE_LABEL = { initial: "Initial Email", fu1: "Follow-up 1", fu2: "Follow-up 2", fu3: "Follow-up 3" };
const STAGE_OFFSET_DAYS = { fu1: 3, fu2: 7, fu3: 14 };
const STATUSES = [
  "Not Researched", "Researched", "Draft Ready", "Sent",
  "Follow-up Due", "Replied", "Booked Call", "Disqualified", "Client Won",
];
const STATUS_COLOR = {
  "Not Researched": "#9CA3AF", "Researched": "#5B8DB8", "Draft Ready": "#C99A3C",
  "Sent": "#8B6FB8", "Follow-up Due": "#D2691E", "Replied": "#2F6F62",
  "Booked Call": "#1F5C4E", "Disqualified": "#A33B3B", "Client Won": "#12283C",
};
const ANGLE_TYPES = ["Recent Post", "Sponsorship/Community", "Award/Milestone", "Review Response", "Personal/Family", "Other"];
const ASSIGNEES = ["Arman", "Partner", "Both"];

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—");

function blankLead(overrides = {}) {
  return {
    id: uid(),
    name: "", city: "", website: "", ownerName: "", phone: "", email: "",
    rating: "", reviewCount: "", fbPage: "Unsure", runningAds: "Unsure",
    fbLikes: "", igFollowers: "", yearsInBusiness: "",
    smykNotes: "", angleType: "",
    status: "Not Researched", disqualifyReason: "",
    assignedTo: "Arman", dateAdded: todayISO(), lastUpdated: todayISO(), lastUpdatedBy: "Arman",
    nextNote: "",
    drafts: { initial: { subject: "", body: "" }, fu1: { subject: "", body: "" }, fu2: { subject: "", body: "" }, fu3: { subject: "", body: "" } },
    sentDates: { initial: "", fu1: "", fu2: "", fu3: "" },
    repliedDate: "",
    ...overrides,
  };
}

const DEFAULT_STATE = { leads: [], dailyGoal: 25 };

// ---------- Supabase-backed shared state ----------
function useCloudState() {
  const [state, setState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from(TABLE).select("data").eq("id", ROW_ID).single();
      if (error || !data) {
        // row doesn't exist yet - create it
        await supabase.from(TABLE).insert({ id: ROW_ID, data: DEFAULT_STATE });
        setState(DEFAULT_STATE);
      } else {
        setState(data.data);
      }
      setLoaded(true);
    })();

    // realtime: refresh when partner updates the row
    channelRef.current = supabase
      .channel("armanleads-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` }, (payload) => {
        setState(payload.new.data);
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const persist = useCallback(async (nextState) => {
    setState(nextState);
    setSaving(true);
    const { error } = await supabase.from(TABLE).update({ data: nextState, updated_at: new Date().toISOString() }).eq("id", ROW_ID);
    if (error) console.error("save failed", error);
    setSaving(false);
  }, []);

  return { state, loaded, saving, persist };
}

// "who am I" - just a local browser preference, not shared data
function useWhoAmI() {
  const [me, setMe] = useState(() => localStorage.getItem("armanleads-whoami") || null);
  const choose = (name) => {
    localStorage.setItem("armanleads-whoami", name);
    setMe(name);
  };
  return { me, choose };
}

// ---------- postage meter ----------
function PostageMeter({ sentToday, goal }) {
  const pct = Math.min(100, Math.round((sentToday / Math.max(1, goal)) * 100));
  const r = 42, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex items-center gap-4">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E4E0D5" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#2F6F62" strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{ marginLeft: "-76px" }} className="flex flex-col items-center justify-center w-[100px]">
        <span className="font-mono text-2xl font-bold text-[#12283C]">{sentToday}</span>
        <span className="font-mono text-[10px] text-[#6B7280] tracking-wide">/ {goal} TODAY</span>
      </div>
      <div className="ml-2">
        <div className="font-serif text-lg text-[#12283C] leading-tight">Daily Postage Meter</div>
        <div className="text-sm text-[#6B7280]">{pct}% of today's sending goal stamped &amp; sent</div>
      </div>
    </div>
  );
}

function StampBadge({ status }) {
  const color = STATUS_COLOR[status] || "#9CA3AF";
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-semibold text-white rounded-sm"
      style={{ backgroundColor: color, border: "1px dashed rgba(255,255,255,0.6)" }}>
      {status}
    </span>
  );
}

function computeFollowupState(lead) {
  if (["Disqualified", "Client Won", "Replied", "Booked Call"].includes(lead.status)) return null;
  if (!lead.sentDates.initial) return null;
  for (const stage of ["fu3", "fu2", "fu1"]) {
    const already = lead.sentDates[stage];
    if (already) continue;
    const offset = STAGE_OFFSET_DAYS[stage];
    const dueDate = new Date(lead.sentDates.initial);
    dueDate.setDate(dueDate.getDate() + offset);
    const today = new Date();
    if (today >= dueDate) {
      const earlierStages = STAGES.slice(1, STAGES.indexOf(stage));
      const earlierMissing = earlierStages.some((s) => !lead.sentDates[s]);
      if (!earlierMissing) return { dueStage: stage, daysOverdue: daysBetween(dueDate, today) };
    }
  }
  return null;
}

export default function App() {
  const { state, loaded, saving, persist } = useCloudState();
  const { me, choose } = useWhoAmI();
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");

  const leads = state?.leads || [];
  const dailyGoal = state?.dailyGoal ?? 25;

  const saveLeads = (nextLeads) => persist({ ...state, leads: nextLeads });
  const saveGoal = (g) => persist({ ...state, dailyGoal: g });

  const updateLead = (id, patch) => {
    const next = leads.map((l) => (l.id === id ? { ...l, ...patch, lastUpdated: todayISO(), lastUpdatedBy: me || l.lastUpdatedBy } : l));
    saveLeads(next);
  };

  const addLead = () => {
    const l = blankLead({ assignedTo: me || "Arman" });
    saveLeads([l, ...leads]);
    setSelectedId(l.id);
    setView("detail");
  };

  const markSent = (lead, stage) => {
    updateLead(lead.id, {
      sentDates: { ...lead.sentDates, [stage]: todayISO() },
      status: stage === "initial" ? "Sent" : lead.status,
    });
  };

  if (!loaded || !state) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F2F1EA]"><div className="font-mono text-[#6B7280] text-sm animate-pulse">loading ledger…</div></div>;
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F1EA] px-6">
        <div className="max-w-sm w-full bg-white border border-[#E4E0D5] rounded-md p-8 text-center shadow-sm">
          <Mail className="mx-auto mb-4 text-[#2F6F62]" size={32} />
          <h1 className="font-serif text-2xl text-[#12283C] mb-1">ArmanLeads Ledger</h1>
          <p className="text-sm text-[#6B7280] mb-6">Who's opening the ledger?</p>
          <div className="flex flex-col gap-2">
            {ASSIGNEES.filter((a) => a !== "Both").map((a) => (
              <button key={a} onClick={() => choose(a)} className="w-full py-2.5 rounded-sm border border-[#12283C] text-[#12283C] font-medium hover:bg-[#12283C] hover:text-white transition-colors">{a}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filtered = leads.filter((l) => {
    const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    const matchesAssignee = assigneeFilter === "All" || l.assignedTo === assigneeFilter;
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const followupsDue = leads.map((l) => ({ l, fu: computeFollowupState(l) })).filter((x) => x.fu).sort((a, b) => b.fu.daysOverdue - a.fu.daysOverdue);
  const draftsInProgress = leads.filter((l) => STAGES.some((s) => l.drafts[s].body && !l.sentDates[s]) && !["Disqualified", "Client Won"].includes(l.status));
  const myQueue = leads.filter((l) => l.assignedTo === me || l.assignedTo === "Both");
  const sentToday = leads.reduce((acc, l) => acc + STAGES.filter((s) => l.sentDates[s] === todayISO()).length, 0);
  const totalSentEmails = leads.reduce((acc, l) => acc + STAGES.filter((s) => l.sentDates[s]).length, 0);
  const withInitial = leads.filter((l) => l.sentDates.initial).length;
  const repliedCount = leads.filter((l) => l.repliedDate).length;
  const bookedOrWon = leads.filter((l) => ["Booked Call", "Client Won"].includes(l.status)).length;
  const replyRate = withInitial ? ((repliedCount / withInitial) * 100).toFixed(1) : "0.0";
  const convRate = withInitial ? ((bookedOrWon / withInitial) * 100).toFixed(1) : "0.0";
  const statusCounts = STATUSES.map((s) => ({ name: s, value: leads.filter((l) => l.status === s).length }));
  const angleStats = ANGLE_TYPES.map((a) => {
    const withAngle = leads.filter((l) => l.angleType === a && l.sentDates.initial);
    const replied = withAngle.filter((l) => l.repliedDate).length;
    return { name: a, rate: withAngle.length ? Math.round((replied / withAngle.length) * 100) : 0, count: withAngle.length };
  });
  const selected = leads.find((l) => l.id === selectedId);

  return (
    <div className="min-h-screen bg-[#F2F1EA] text-[#12283C]">
      <div className="bg-[#12283C] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Mail size={22} className="text-[#C99A3C]" />
          <div>
            <div className="font-serif text-lg leading-none">ArmanLeads Ledger</div>
            <div className="text-[11px] text-white/50 font-mono mt-0.5">{me} · {saving ? "saving…" : "synced"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("dashboard")} className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${view === "dashboard" ? "bg-white text-[#12283C]" : "text-white/70 hover:text-white"}`}>Dashboard</button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${view === "list" ? "bg-white text-[#12283C]" : "text-white/70 hover:text-white"}`}>All Clinics</button>
          <button onClick={addLead} className="px-3 py-1.5 rounded-sm text-sm font-medium bg-[#2F6F62] text-white flex items-center gap-1 hover:bg-[#265A50] transition-colors"><Plus size={14} /> New Clinic</button>
        </div>
      </div>

      {view === "dashboard" && (
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          <div className="bg-white border border-[#E4E0D5] rounded-md p-6 flex items-center justify-between flex-wrap gap-4">
            <PostageMeter sentToday={sentToday} goal={dailyGoal} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280] font-mono">DAILY GOAL</span>
              <input type="number" value={dailyGoal} onChange={(e) => saveGoal(Number(e.target.value) || 0)} className="w-16 border border-[#E4E0D5] rounded-sm px-2 py-1 font-mono text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E4E0D5] rounded-md p-4">
              <div className="flex items-center gap-2 mb-3 text-[#D2691E]"><AlertTriangle size={16} /><h3 className="font-serif text-base">Follow-ups Due</h3></div>
              {followupsDue.length === 0 && <p className="text-sm text-[#9CA3AF]">Nothing due — clean queue.</p>}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {followupsDue.map(({ l, fu }) => (
                  <button key={l.id} onClick={() => { setSelectedId(l.id); setView("detail"); }} className="w-full text-left flex items-center justify-between p-2 rounded-sm hover:bg-[#F7F5EF] border border-[#EEEAE0]">
                    <div><div className="text-sm font-medium">{l.name || "Unnamed clinic"}</div><div className="text-[11px] text-[#6B7280] font-mono">{STAGE_LABEL[fu.dueStage]} · {fu.daysOverdue > 0 ? `${fu.daysOverdue}d overdue` : "due today"}</div></div>
                    <ChevronRight size={14} className="text-[#9CA3AF]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E4E0D5] rounded-md p-4">
              <div className="flex items-center gap-2 mb-3 text-[#C99A3C]"><Save size={16} /><h3 className="font-serif text-base">Drafts In Progress</h3></div>
              {draftsInProgress.length === 0 && <p className="text-sm text-[#9CA3AF]">No unsent drafts sitting around.</p>}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {draftsInProgress.map((l) => (
                  <button key={l.id} onClick={() => { setSelectedId(l.id); setView("detail"); }} className="w-full text-left flex items-center justify-between p-2 rounded-sm hover:bg-[#F7F5EF] border border-[#EEEAE0]">
                    <div><div className="text-sm font-medium">{l.name || "Unnamed clinic"}</div><div className="text-[11px] text-[#6B7280] font-mono">{l.assignedTo}</div></div>
                    <ChevronRight size={14} className="text-[#9CA3AF]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E4E0D5] rounded-md p-4">
              <div className="flex items-center gap-2 mb-3 text-[#2F6F62]"><User size={16} /><h3 className="font-serif text-base">{me}'s Queue</h3></div>
              {myQueue.length === 0 && <p className="text-sm text-[#9CA3AF]">Nothing assigned to you right now.</p>}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {myQueue.map((l) => (
                  <button key={l.id} onClick={() => { setSelectedId(l.id); setView("detail"); }} className="w-full text-left flex items-center justify-between p-2 rounded-sm hover:bg-[#F7F5EF] border border-[#EEEAE0]">
                    <div><div className="text-sm font-medium">{l.name || "Unnamed clinic"}</div><div className="text-[11px] text-[#6B7280]">{l.nextNote || l.status}</div></div>
                    <StampBadge status={l.status} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#E4E0D5] rounded-md p-4">
              <h3 className="font-serif text-base mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-[#2F6F62]" /> Pipeline Overview</h3>
              <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-sm">
                <div><span className="text-2xl font-bold">{totalSentEmails}</span><div className="text-[11px] text-[#6B7280]">emails sent (all stages)</div></div>
                <div><span className="text-2xl font-bold">{replyRate}%</span><div className="text-[11px] text-[#6B7280]">reply rate</div></div>
                <div><span className="text-2xl font-bold">{convRate}%</span><div className="text-[11px] text-[#6B7280]">conversion to booked/won</div></div>
                <div><span className="text-2xl font-bold">{leads.length}</span><div className="text-[11px] text-[#6B7280]">total clinics tracked</div></div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={statusCounts} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]}>{statusCounts.map((s, i) => <Cell key={i} fill={STATUS_COLOR[s.name]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-[#E4E0D5] rounded-md p-4">
              <h3 className="font-serif text-base mb-3 flex items-center gap-2"><Star size={16} className="text-[#C99A3C]" /> SMYK Angle Performance</h3>
              <p className="text-[11px] text-[#6B7280] mb-2">Reply rate by personalization angle used.</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={angleStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={(v, n, p) => [`${v}% (n=${p.payload.count})`, "Reply rate"]} />
                  <Bar dataKey="rate" fill="#2F6F62" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 bg-white border border-[#E4E0D5] rounded-sm px-3 py-1.5 flex-1 min-w-[200px]">
              <Search size={14} className="text-[#9CA3AF]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clinic or city…" className="outline-none text-sm w-full" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-[#E4E0D5] rounded-sm px-2 py-1.5 text-sm bg-white"><option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="border border-[#E4E0D5] rounded-sm px-2 py-1.5 text-sm bg-white"><option>All</option>{ASSIGNEES.map((a) => <option key={a}>{a}</option>)}</select>
          </div>
          <div className="bg-white border border-[#E4E0D5] rounded-md overflow-hidden">
            {filtered.length === 0 && <div className="p-6 text-center text-sm text-[#9CA3AF]">No clinics match. Add one with "New Clinic".</div>}
            {filtered.map((l) => (
              <button key={l.id} onClick={() => { setSelectedId(l.id); setView("detail"); }} className="w-full text-left flex items-center justify-between px-4 py-3 border-b border-[#EEEAE0] last:border-0 hover:bg-[#F7F5EF]">
                <div className="flex items-center gap-3"><div><div className="text-sm font-medium">{l.name || "Unnamed clinic"}</div><div className="text-[11px] text-[#6B7280] flex items-center gap-1"><MapPin size={10} />{l.city || "—"}</div></div></div>
                <div className="flex items-center gap-3"><span className="text-[11px] font-mono text-[#6B7280]">{l.assignedTo}</span><StampBadge status={l.status} /><ChevronRight size={14} className="text-[#9CA3AF]" /></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "detail" && selected && (
        <LeadDetail lead={selected} onBack={() => setView("list")} onUpdate={(patch) => updateLead(selected.id, patch)} onMarkSent={(stage) => markSent(selected, stage)} />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="text-[11px] font-mono text-[#6B7280] uppercase tracking-wide">{label}</span>{children}</label>;
}
const inputCls = "mt-1 w-full border border-[#E4E0D5] rounded-sm px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#2F6F62]";

function LeadDetail({ lead, onBack, onUpdate, onMarkSent }) {
  const [activeStage, setActiveStage] = useState("initial");
  const fu = computeFollowupState(lead);
  const setField = (k, v) => onUpdate({ [k]: v });
  const setDraft = (stage, field, val) => onUpdate({ drafts: { ...lead.drafts, [stage]: { ...lead.drafts[stage], [field]: val } } });

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#12283C] mb-4"><ArrowLeft size={14} /> Back to all clinics</button>
      <div className="bg-white border border-[#E4E0D5] rounded-md p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input value={lead.name} onChange={(e) => setField("name", e.target.value)} placeholder="Clinic name" className="font-serif text-2xl w-full outline-none border-b border-transparent focus:border-[#E4E0D5] pb-1" />
            <input value={lead.city} onChange={(e) => setField("city", e.target.value)} placeholder="City, State" className="text-sm text-[#6B7280] w-full outline-none mt-1" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <StampBadge status={lead.status} />
            {fu && <span className="text-[11px] font-mono text-[#D2691E]">{STAGE_LABEL[fu.dueStage]} due {fu.daysOverdue > 0 ? `(${fu.daysOverdue}d overdue)` : "today"}</span>}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Field label="Status"><select value={lead.status} onChange={(e) => setField("status", e.target.value)} className={inputCls}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Assigned To"><select value={lead.assignedTo} onChange={(e) => setField("assignedTo", e.target.value)} className={inputCls}>{ASSIGNEES.map((a) => <option key={a}>{a}</option>)}</select></Field>
          <Field label="Angle Type"><select value={lead.angleType} onChange={(e) => setField("angleType", e.target.value)} className={inputCls}><option value="">—</option>{ANGLE_TYPES.map((a) => <option key={a}>{a}</option>)}</select></Field>
          <Field label="Replied Date"><input type="date" value={lead.repliedDate} onChange={(e) => setField("repliedDate", e.target.value)} className={inputCls} /></Field>
        </div>
        {lead.status === "Disqualified" && <Field label="Disqualify Reason"><textarea value={lead.disqualifyReason} onChange={(e) => setField("disqualifyReason", e.target.value)} className={inputCls} rows={2} /></Field>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Field label="Website"><input value={lead.website} onChange={(e) => setField("website", e.target.value)} className={inputCls} /></Field>
          <Field label="Owner Name"><input value={lead.ownerName} onChange={(e) => setField("ownerName", e.target.value)} className={inputCls} /></Field>
          <Field label="Phone"><input value={lead.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} /></Field>
          <Field label="Email"><input value={lead.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} /></Field>
          <Field label="Google Rating"><input value={lead.rating} onChange={(e) => setField("rating", e.target.value)} className={inputCls} /></Field>
          <Field label="Review Count"><input value={lead.reviewCount} onChange={(e) => setField("reviewCount", e.target.value)} className={inputCls} /></Field>
          <Field label="FB Page?"><select value={lead.fbPage} onChange={(e) => setField("fbPage", e.target.value)} className={inputCls}><option>Yes</option><option>No</option><option>Unsure</option></select></Field>
          <Field label="Running Ads?"><select value={lead.runningAds} onChange={(e) => setField("runningAds", e.target.value)} className={inputCls}><option>Yes</option><option>No</option><option>Unsure</option></select></Field>
          <Field label="FB Likes"><input value={lead.fbLikes} onChange={(e) => setField("fbLikes", e.target.value)} className={inputCls} /></Field>
          <Field label="IG Followers"><input value={lead.igFollowers} onChange={(e) => setField("igFollowers", e.target.value)} className={inputCls} /></Field>
          <Field label="Years in Business"><input value={lead.yearsInBusiness} onChange={(e) => setField("yearsInBusiness", e.target.value)} className={inputCls} /></Field>
        </div>
        <div className="mt-4"><Field label="SMYK Personalization Notes"><textarea value={lead.smykNotes} onChange={(e) => setField("smykNotes", e.target.value)} className={inputCls} rows={3} /></Field></div>
        <div className="mt-4"><Field label="Next Action / Note to Partner"><textarea value={lead.nextNote} onChange={(e) => setField("nextNote", e.target.value)} className={inputCls} rows={2} /></Field></div>
        <div className="text-[11px] text-[#9CA3AF] font-mono mt-3">Added {fmtDate(lead.dateAdded)} · Last updated {fmtDate(lead.lastUpdated)} by {lead.lastUpdatedBy}</div>
      </div>

      <div className="bg-white border border-[#E4E0D5] rounded-md p-6">
        <h3 className="font-serif text-lg mb-3">Email Drafts</h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          {STAGES.map((s) => (
            <button key={s} onClick={() => setActiveStage(s)} className={`px-3 py-1.5 rounded-sm text-sm font-medium border ${activeStage === s ? "bg-[#12283C] text-white border-[#12283C]" : "border-[#E4E0D5] text-[#6B7280]"}`}>
              {STAGE_LABEL[s]} {lead.sentDates[s] && <CheckCircle2 size={12} className="inline ml-1 -mt-0.5" />}
            </button>
          ))}
        </div>
        <Field label="Subject"><input value={lead.drafts[activeStage].subject} onChange={(e) => setDraft(activeStage, "subject", e.target.value)} className={inputCls} /></Field>
        <div className="mt-3"><Field label="Body"><textarea value={lead.drafts[activeStage].body} onChange={(e) => setDraft(activeStage, "body", e.target.value)} className={inputCls} rows={8} /></Field></div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] font-mono text-[#6B7280]">{lead.sentDates[activeStage] ? `Sent ${fmtDate(lead.sentDates[activeStage])}` : "Not sent yet — draft autosaves"}</span>
          {!lead.sentDates[activeStage] && (
            <button onClick={() => onMarkSent(activeStage)} disabled={!lead.drafts[activeStage].body} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium bg-[#2F6F62] text-white disabled:bg-[#D1D5DB] disabled:cursor-not-allowed hover:bg-[#265A50]">
              <Send size={13} /> Mark {STAGE_LABEL[activeStage]} as Sent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
