import React, { useState } from "react";
import { Mail } from "lucide-react";
import { useCloudState, useWhoAmI } from "./lib/useCloudState";
import { STAGES, STATUSES, DEFAULT_ANGLE_TYPES, todayISO, blankLead, computeFollowupState } from "./lib/constants";
import Sidebar from "./components/Sidebar";
import { MobileTopBar, MobileBottomBar } from "./components/MobileNav";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import LeadsList from "./components/LeadsList";
import LeadDetail from "./components/LeadDetail";

export default function App() {
  const { state, loaded, saving, persist } = useCloudState();
  const { me, choose, clear } = useWhoAmI();
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const leads = state?.leads || [];
  const dailyGoal = state?.dailyGoal ?? 25;
  const customAngleTypes = state?.customAngleTypes || [];

  const saveLeads = (nextLeads) => persist({ ...state, leads: nextLeads });
  const saveGoal = (g) => persist({ ...state, dailyGoal: g });
  const addCustomAngleType = (val) => {
    if (!customAngleTypes.includes(val) && !DEFAULT_ANGLE_TYPES.includes(val)) {
      persist({ ...state, customAngleTypes: [...customAngleTypes, val] });
    }
  };

  const updateLead = (id, patch) => {
    const next = leads.map((l) => (l.id === id ? { ...l, ...patch, lastUpdated: todayISO(), lastUpdatedBy: me || l.lastUpdatedBy } : l));
    saveLeads(next);
  };

  const deleteLead = (id) => {
    saveLeads(leads.filter((l) => l.id !== id));
    setView("list");
    setSelectedId(null);
    setConfirmDelete(false);
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

  const goToLead = (id) => { setSelectedId(id); setView("detail"); };

  if (!loaded || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3A8172] to-[#1F5C4E] flex items-center justify-center animate-pulse">
            <Mail size={18} className="text-white" />
          </div>
          <div className="font-mono text-[#8A8574] text-xs tracking-wide">loading ledger…</div>
        </div>
      </div>
    );
  }

  if (!me) {
    return <LoginScreen onChoose={choose} />;
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
  const allAngleTypes = [...DEFAULT_ANGLE_TYPES, ...customAngleTypes];
  const angleStats = allAngleTypes.map((a) => {
    const withAngle = leads.filter((l) => l.angleType === a && l.sentDates.initial);
    const replied = withAngle.filter((l) => l.repliedDate).length;
    return { name: a, rate: withAngle.length ? Math.round((replied / withAngle.length) * 100) : 0, count: withAngle.length };
  }).filter((a) => a.count > 0);
  const selected = leads.find((l) => l.id === selectedId);

  return (
    <div className="min-h-screen bg-[#F5F3EC] text-[#12283C]">
      <Sidebar view={view} setView={setView} onAddLead={addLead} me={me} saving={saving} onSwitchIdentity={clear} />
      <MobileTopBar me={me} saving={saving} onSwitchIdentity={clear} />

      <main className="md:pl-64 pb-32 md:pb-10">
        <div key={view} className="px-4 sm:px-6 py-6 animate-fade-in">
          {view === "dashboard" && (
            <div className="max-w-6xl mx-auto">
              <Dashboard
                me={me}
                sentToday={sentToday}
                dailyGoal={dailyGoal}
                onGoalChange={saveGoal}
                followupsDue={followupsDue}
                draftsInProgress={draftsInProgress}
                myQueue={myQueue}
                totalSentEmails={totalSentEmails}
                replyRate={replyRate}
                convRate={convRate}
                totalLeads={leads.length}
                statusCounts={statusCounts}
                angleStats={angleStats}
                onSelectLead={goToLead}
              />
            </div>
          )}

          {view === "list" && (
            <div className="max-w-6xl mx-auto">
              <LeadsList
                leads={leads}
                filtered={filtered}
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                assigneeFilter={assigneeFilter}
                setAssigneeFilter={setAssigneeFilter}
                onSelectLead={goToLead}
                onAddLead={addLead}
              />
            </div>
          )}

          {view === "detail" && selected && (
            <div className="max-w-4xl mx-auto">
              <LeadDetail
                lead={selected}
                onBack={() => setView("list")}
                onUpdate={(patch) => updateLead(selected.id, patch)}
                onMarkSent={(stage) => markSent(selected, stage)}
                onDelete={() => deleteLead(selected.id)}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                customAngleTypes={customAngleTypes}
                onAddCustomAngle={addCustomAngleType}
              />
            </div>
          )}
        </div>
      </main>

      <MobileBottomBar view={view} setView={setView} onAddLead={addLead} />
    </div>
  );
}
