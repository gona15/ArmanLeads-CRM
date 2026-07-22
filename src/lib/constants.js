// ---------- core data model & business logic ----------
// Moved verbatim out of App.jsx during the UI/UX rebuild. Nothing in this
// file changes behavior, field names, or the Supabase schema — only its
// location moved, so existing rows in Supabase keep working unchanged.

export const ROW_ID = "main";
export const TABLE = "armanleads_state";

export const STAGES = ["initial", "fu1", "fu2", "fu3"];
export const STAGE_LABEL = { initial: "Initial Email", fu1: "Follow-up 1", fu2: "Follow-up 2", fu3: "Follow-up 3" };
export const STAGE_OFFSET_DAYS = { fu1: 3, fu2: 7, fu3: 14 };
export const STATUSES = [
  "Not Researched", "Researched", "Draft Ready", "Sent",
  "Follow-up Due", "Replied", "Booked Call", "Disqualified", "Client Won",
];
export const STATUS_COLOR = {
  "Not Researched": "#9CA3AF", "Researched": "#5B8DB8", "Draft Ready": "#C99A3C",
  "Sent": "#8B6FB8", "Follow-up Due": "#D2691E", "Replied": "#2F6F62",
  "Booked Call": "#1F5C4E", "Disqualified": "#A33B3B", "Client Won": "#12283C",
};
// The six SMYKM persuasion angles actually used in outreach methodology —
// what argument the email makes, not what research trigger surfaced it.
// "Personal/Family" was deliberately dropped: it conflicted with the hard
// rule that personal/family details about a prospect are never used.
export const DEFAULT_ANGLE_TYPES = ["Industry Peer", "Reviews & Reputation", "Community/Local", "Content/Social", "Competitive Landscape", "Business Model/Bandwidth"];
export const ASSIGNEES = ["Arman", "Prusha", "Both"];

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—");
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

// ---------- personal/family content guard ----------
// Conservative keyword heuristic, not a hard block — flags likely
// personal/family content in research notes or drafts so it can't slip
// into outreach unnoticed (see the University Dental Group / Spellman
// precedent). False positives are fine; false negatives are the risk to
// avoid, so this errs toward flagging.
const PERSONAL_CONTENT_PATTERNS = [
  /\b(daughter|son|wife|husband|spouse|kids?|children|toddler|newborn|baby|fiancé|fiancee|girlfriend|boyfriend)\b/i,
  /\b\d{1,2}\s*[- ]?(yo|yr|year)s?[- ]?old\b/i,
  /\bturn(ed|ing)?\s+\d{1,2}\b/i,
  /\b(her|his|their)\s+(birthday|bday)\b/i,
];

export function detectPersonalContent(text) {
  if (!text) return { flagged: false, matches: [] };
  const matches = [];
  for (const re of PERSONAL_CONTENT_PATTERNS) {
    const m = text.match(re);
    if (m) matches.push(m[0]);
  }
  return { flagged: matches.length > 0, matches };
}

// ---------- lightweight per-lead activity log ----------
export function logActivity(lead, by, action) {
  const entry = { at: new Date().toISOString(), by: by || "Unknown", action };
  const next = [...(lead.activityLog || []), entry];
  return next.slice(-50); // cap so this can't grow unbounded in the JSON blob
}

// Which angle types this lead has already used across its drafts, so a
// follow-up can be pointed at a fresh one instead of repeating itself.
export function usedAngleTypes(lead) {
  const perStage = Object.values(lead.stageAngles || {}).filter(Boolean);
  if (perStage.length) return [...new Set(perStage)];
  return lead.angleType ? [lead.angleType] : [];
}

export function suggestNextAngle(lead, allAngleTypes) {
  const used = usedAngleTypes(lead);
  return allAngleTypes.find((a) => !used.includes(a)) || null;
}

// Fills in any fields missing from leads saved before a schema addition
// (activityLog, stageAngles, gmailThreadId, etc.) with blankLead()'s
// defaults, without touching any real value that's already there.
export function normalizeLead(lead) {
  const blank = blankLead();
  return {
    ...blank,
    ...lead,
    drafts: { ...blank.drafts, ...lead.drafts },
    sentDates: { ...blank.sentDates, ...lead.sentDates },
    stageAngles: { ...blank.stageAngles, ...lead.stageAngles },
  };
}

export function blankLead(overrides = {}) {
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
    stageAngles: { initial: "", fu1: "", fu2: "", fu3: "" },
    repliedDate: "",
    gmailThreadId: "",
    activityLog: [],
    ...overrides,
  };
}

export const DEFAULT_STATE = { leads: [], dailyGoal: 25, customAngleTypes: [], activeCity: "", completedCities: [] };

// One card per distinct city seen across leads — used by the Cities view
// so Arman can see progress market-by-market and know when a city is
// wrapped up and it's time to move to the next one.
export function groupByCity(leads) {
  const cities = [...new Set(leads.map((l) => (l.city || "").trim()).filter(Boolean))].sort();
  return cities.map((city) => {
    const cityLeads = leads.filter((l) => (l.city || "").trim() === city);
    return {
      city,
      total: cityLeads.length,
      notStarted: cityLeads.filter((l) => l.status === "Not Researched").length,
      inProgress: cityLeads.filter((l) => !["Not Researched", "Disqualified", "Client Won"].includes(l.status)).length,
      sent: cityLeads.filter((l) => l.sentDates.initial).length,
      replied: cityLeads.filter((l) => l.repliedDate).length,
      won: cityLeads.filter((l) => l.status === "Client Won").length,
      disqualified: cityLeads.filter((l) => l.status === "Disqualified").length,
    };
  });
}

export function computeFollowupState(lead) {
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
