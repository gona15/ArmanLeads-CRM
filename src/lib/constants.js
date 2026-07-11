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
export const DEFAULT_ANGLE_TYPES = ["Recent Post", "Sponsorship/Community", "Award/Milestone", "Review Response", "Personal/Family", "New Location/Expansion", "Team/Staff Highlight", "Holiday/Seasonal Post"];
export const ASSIGNEES = ["Arman", "Prusha", "Both"];

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—");

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
    repliedDate: "",
    ...overrides,
  };
}

export const DEFAULT_STATE = { leads: [], dailyGoal: 25, customAngleTypes: [] };

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
