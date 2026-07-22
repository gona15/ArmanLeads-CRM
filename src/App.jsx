import React, { useState } from "react";
import { Mail } from "lucide-react";
import { useCloudState, useWhoAmI } from "./lib/useCloudState";
import { STAGES, STATUSES, DEFAULT_ANGLE_TYPES, todayISO, blankLead, computeFollowupState, logActivity, groupByCity } from "./lib/constants";
import Sidebar from "./components/Sidebar";
import { MobileTopBar, MobileBottomBar } from "./components/MobileNav";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import LeadsList from "./components/LeadsList";
import LeadDetail from "./components/LeadDetail";
import TodayView from "./components/TodayView";
import CitiesView from "./components/CitiesView";
import QuickSearch from "./components/QuickSearch";

export default function App() {
  const { state, loaded, saving, persist } = useCloudState();
  const { me, choose, clear } = useWhoAmI();
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  const leads = state?.leads || [];
  const dailyGoal = state?.dailyGoal ?? 25;
  const customAngleTypes = state?.customAngleTypes || [];
  const activeCity = state?.activeCity || "";
  const completedCities = state?.completedCities || [];

  const saveLeads = (nextLeads) => persist({ ...state, leads: nextLeads });
  const saveGoal = (g) => persist({ ...state, dailyGoal: g });
  const addCustomAngleType = (val) => {
    if (!customAngleTypes.includes(val) && !DEFAULT_ANGLE_TYPES.includes(val)) {
      persist({ ...state, customAngleTypes: [...customAngleTypes, val] });
    }
  };

  const updateLead = (id, patch, activityNote) => {
    const next = leads.map((l) => {
      if (l.id !== id) return l;
      const merged = { ...l, ...patch, lastUpdated: todayISO(), lastUpdatedBy: me || l.lastUpdatedBy };
      if (activityNote) merged.activityLog = logActivity(l, me, activityNote);
      return merged;
    });
    saveLeads(next);
  };

  const deleteLead = (id) => {
    saveLeads(leads.filter((l) => l.id !== id));
    setView("list");
    setSelectedId(null);
    setConfirmDelete(false);
  };

  // Duplicate check is a warning, not a block — same name + same city,
  // case-insensitive, ignoring blank names so a fresh blank lead never
  // matches another fresh blank lead.
  const findDuplicates = (lead) => {
    if (!lead?.name?.trim()) return [];
    const name = lead.name.trim().toLowerCase();
    const city = (lead.city || "").trim().toLowerCase();
    return leads.filter((l) => l.id !== lead.id && l.name.trim().toLowerCase() === name && (l.city || "").trim().toLowerCase() === city);
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
    }, `Marked ${stage} as sent`);
  };

  // Undoes an accidental "mark sent" click — clears the sent date for that
  // stage (and reverts status back to Draft Ready if it was the initial
  // stage that got marked), so a slipped click is always recoverable.
  const unmarkSent = (lead, stage) => {
    updateLead(lead.id, {
      sentDates: { ...lead.sentDates, [stage]: "" },
      status: stage === "initial" && lead.status === "Sent" ? "Draft Ready" : lead.status,
    }, `Undid ${stage} sent`);
  };

  const goToLead = (id) => { setSelectedId(id); setView("detail"); };

  const setActiveCity = (city) => persist({ ...state, activeCity: city, completedCities: completedCities.filter((c) => c !== city) });
  const markCityComplete = (city) => persist({ ...state, completedCities: [...new Set([...completedCities, city])], activeCity: activeCity === city ? "" : activeCity });
  const reopenCity = (city) => persist({ ...state, completedCities: completedCities.filter((c) => c !== city) });
  const viewCity = (city) => { setCityFilter(city); setView("list"); };

  const openQuickSearch = () => setQuickSearchOpen(true);
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    const matchesSearch = !search || (l.name || "").toLowerCase().includes(search.toLowerCase()) || (l.city || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    const matchesAssignee = assigneeFilter === "All" || l.assignedTo === assigneeFilter;
    const matchesCity = cityFilter === "All" || l.city === cityFilter;
    return matchesSearch && matchesStatus && matchesAssignee && matchesCity;
  });
  const allCities = [...new Set(leads.map((l) => l.city).filter(Boolean))].sort();
  const cityGroups = groupByCity(leads);

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
      <Sidebar
        view={view}
        setView={setView}
        onAddLead={addLead}
        me={me}
        saving={saving}
        onSwitchIdentity={clear}
        activeCity={activeCity}
        onOpenSearch={openQuickSearch}
      />
      <MobileTopBar me={me} saving={saving} onSwitchIdentity={clear} onOpenSearch={openQuickSearch} />
      <QuickSearch
        open={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        leads={leads}
        onSelectLead={(id) => { setQuickSearchOpen(false); goToLead(id); }}
      />

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

          {view === "today" && (
            <div className="max-w-6xl mx-auto">
              <TodayView
                followupsDue={followupsDue}
                draftsInProgress={draftsInProgress}
                recentlyAdded={leads.filter((l) => l.dateAdded === todayISO())}
                onSelectLead={goToLead}
              />
            </div>
          )}

          {view === "cities" && (
            <div className="max-w-6xl mx-auto">
              <CitiesView
                cityGroups={cityGroups}
                activeCity={activeCity}
                completedCities={completedCities}
                onSetActiveCity={setActiveCity}
                onMarkComplete={markCityComplete}
                onReopenCity={reopenCity}
                onViewCity={viewCity}
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
                cityFilter={cityFilter}
                setCityFilter={setCityFilter}
                allCities={allCities}
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
                onUnmarkSent={(stage) => unmarkSent(selected, stage)}
                onDelete={() => deleteLead(selected.id)}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                customAngleTypes={customAngleTypes}
                onAddCustomAngle={addCustomAngleType}
                allAngleTypes={allAngleTypes}
                duplicates={findDuplicates(selected)}
              />
            </div>
          )}
        </div>
      </main>

      <MobileBottomBar view={view} setView={setView} onAddLead={addLead} />
    </div>
  );
}
