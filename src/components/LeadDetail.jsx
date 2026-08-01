import React, { useState } from "react";
import { ArrowLeft, Trash2, CheckCircle2, Send, Search, FileText, Phone, Undo2, ShieldAlert, Clock, Users, MousePointerClick, Maximize2, Link2 } from "lucide-react";
import CityAutocomplete from "./CityAutocomplete";
import AngleTypeSelect from "./AngleTypeSelect";
import StatusBadge from "./ui/StatusBadge";
import Select from "./ui/Select";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import { Field, inputCls, textareaCls } from "./ui/Field";
import {
  STAGES, STAGE_LABEL, STATUSES, ASSIGNEES, computeFollowupState, fmtDate, fmtDateTime,
  detectPersonalContent, suggestNextAngle,
} from "../lib/constants";
import { BRAND_MAROON } from "../lib/theme";

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="surface p-5 sm:p-6">
      <h3 className="font-serif text-base text-[#12283C] mb-4 flex items-center gap-2">
        <Icon size={15} className="text-[#8A8574]" /> {title}
      </h3>
      {children}
    </div>
  );
}

export default function LeadDetail({
  lead, onBack, onUpdate, onMarkSent, onUnmarkSent, onDelete, confirmDelete, setConfirmDelete,
  customAngleTypes, onAddCustomAngle, allAngleTypes, duplicates, clickInfo,
}) {
  const [activeStage, setActiveStage] = useState("initial");
  const [confirmStage, setConfirmStage] = useState(null); // { stage, action: "send" | "undo" }
  const [composeExpanded, setComposeExpanded] = useState(false);
  const fu = computeFollowupState(lead);
  const setField = (k, v) => onUpdate({ [k]: v });
  const setDraft = (stage, field, val) => onUpdate({ drafts: { ...lead.drafts, [stage]: { ...lead.drafts[stage], [field]: val } } });
  const setStageAngle = (stage, val) => onUpdate({ stageAngles: { ...lead.stageAngles, [stage]: val } });
  const wordCount = (lead.drafts[activeStage].body || "").trim().split(/\s+/).filter(Boolean).length;
  // Real sent initials average 158 words (111-223 range, n=43) - a prior
  // tightening pass targeted 111-131 and that discipline has drifted since.
  // Not a hard limit, just a nudge back toward it as it creeps up.
  const wordCountColor = wordCount > 200 ? BRAND_MAROON : wordCount > 160 ? "#C99A3C" : "#B8B2A0";
  const suggestedAngle = suggestNextAngle(lead, allAngleTypes || []);
  // Personal/family content is checked once, at the highest-stakes moment (right
  // before confirming a send) rather than as a persistent nag while drafting —
  // see the "Mark as sent" confirm modal below.
  const sendWarning = confirmStage?.action === "send"
    ? detectPersonalContent(lead.drafts[confirmStage.stage]?.body)
    : { flagged: false, matches: [] };
  // Same "check once, at send time" treatment as the personal-content flag —
  // catches a body that got written or edited without the tracked link.
  const sendBody = confirmStage?.action === "send" ? (lead.drafts[confirmStage.stage]?.body || "") : "";
  const missingLinkWarning = sendBody.length > 0 && !sendBody.includes(`armanleads.com/r/${lead.id}`);
  // ?s={stage} lets a click be attributed to the specific email it was in,
  // not just the lead — see normalizeClicks() in lib/constants.js.
  const insertTrackedLink = (stage) => {
    const body = lead.drafts[stage].body || "";
    if (body.includes(`armanleads.com/r/${lead.id}`)) return;
    const sep = body && !body.endsWith("\n\n") ? (body.endsWith("\n") ? "\n" : "\n\n") : "";
    setDraft(stage, "body", `${body}${sep}armanleads.com/r/${lead.id}?s=${stage}`);
  };
  const stageClickInfo = clickInfo?.byStage?.[activeStage];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#8A8574] hover:text-[#12283C] transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back to all clinics
        </button>
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={13} /> Delete clinic
        </Button>
      </div>

      {duplicates && duplicates.length > 0 && (
        <div
          className="rounded-2xl p-3.5 flex items-start gap-2.5 text-sm"
          style={{ backgroundColor: "rgba(122,31,43,0.06)", border: `1px solid rgba(122,31,43,0.18)`, color: BRAND_MAROON }}
        >
          <Users size={16} className="shrink-0 mt-0.5" />
          <span>
            Same name + city already exists ({duplicates.length === 1 ? "1 other clinic" : `${duplicates.length} other clinics`}) — double check this isn't a duplicate entry.
          </span>
        </div>
      )}

      <div className="surface p-5 sm:p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              value={lead.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Clinic name"
              className="font-serif text-2xl w-full outline-none border-b border-transparent focus:border-[#E4E0D5] pb-1 bg-transparent text-[#12283C] placeholder:text-[#B8B2A0]"
            />
            <div className="mt-2 max-w-xs">
              <CityAutocomplete value={lead.city} onChange={(v) => setField("city", v)} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={lead.status} />
            {fu && (
              <span className="text-[11px] font-mono flex items-center gap-1" style={{ color: fu.daysOverdue > 0 ? BRAND_MAROON : "#D2691E" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fu.daysOverdue > 0 ? BRAND_MAROON : "#D2691E" }} />
                {STAGE_LABEL[fu.dueStage]} due {fu.daysOverdue > 0 ? `(${fu.daysOverdue}d overdue)` : "today"}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Status">
            <Select value={lead.status} onChange={(e) => setField("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Assigned To">
            <Select value={lead.assignedTo} onChange={(e) => setField("assignedTo", e.target.value)}>
              {ASSIGNEES.map((a) => <option key={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label="Angle Type">
            <AngleTypeSelect value={lead.angleType} onChange={(v) => setField("angleType", v)} customTypes={customAngleTypes} onAddCustom={onAddCustomAngle} />
          </Field>
          <Field label="Replied Date">
            <input type="date" value={lead.repliedDate} onChange={(e) => setField("repliedDate", e.target.value)} className={inputCls} />
          </Field>
        </div>

        {lead.status === "Disqualified" && (
          <div className="mt-4">
            <Field label="Disqualify Reason">
              <textarea value={lead.disqualifyReason} onChange={(e) => setField("disqualifyReason", e.target.value)} className={textareaCls} rows={2} />
            </Field>
          </div>
        )}
      </div>

      <SectionCard icon={Phone} title="Contact & Location">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Website"><input value={lead.website} onChange={(e) => setField("website", e.target.value)} className={inputCls} /></Field>
          <Field label="Owner Name"><input value={lead.ownerName} onChange={(e) => setField("ownerName", e.target.value)} className={inputCls} /></Field>
          <Field label="Phone"><input value={lead.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} /></Field>
          <Field label="Email"><input value={lead.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} /></Field>
        </div>
      </SectionCard>

      <SectionCard icon={Search} title="Research Signals">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Google Rating"><input value={lead.rating} onChange={(e) => setField("rating", e.target.value)} className={inputCls} /></Field>
          <Field label="Review Count"><input value={lead.reviewCount} onChange={(e) => setField("reviewCount", e.target.value)} className={inputCls} /></Field>
          <Field label="FB Page?">
            <Select value={lead.fbPage} onChange={(e) => setField("fbPage", e.target.value)}>
              <option>Yes</option><option>No</option><option>Unsure</option>
            </Select>
          </Field>
          <Field label="Running Ads?">
            <Select value={lead.runningAds} onChange={(e) => setField("runningAds", e.target.value)}>
              <option>Yes</option><option>No</option><option>Unsure</option>
            </Select>
          </Field>
          <Field label="FB Likes"><input value={lead.fbLikes} onChange={(e) => setField("fbLikes", e.target.value)} className={inputCls} /></Field>
          <Field label="IG Followers"><input value={lead.igFollowers} onChange={(e) => setField("igFollowers", e.target.value)} className={inputCls} /></Field>
          <Field label="Years in Business"><input value={lead.yearsInBusiness} onChange={(e) => setField("yearsInBusiness", e.target.value)} className={inputCls} /></Field>
        </div>
      </SectionCard>

      <SectionCard icon={FileText} title="Notes">
        <div className="space-y-4">
          <Field label="SMYK Personalization Notes">
            <textarea value={lead.smykNotes} onChange={(e) => setField("smykNotes", e.target.value)} className={textareaCls} rows={10} />
          </Field>
          <Field label="Next Action / Note to Partner"><textarea value={lead.nextNote} onChange={(e) => setField("nextNote", e.target.value)} className={textareaCls} rows={4} /></Field>
        </div>
      </SectionCard>

      <div className="text-[11px] text-[#B8B2A0] font-mono px-1">
        Added {fmtDate(lead.dateAdded)} · Last updated {fmtDate(lead.lastUpdated)} by {lead.lastUpdatedBy}
      </div>

      <SectionCard icon={Send} title="Email Drafts">
        <div className="flex gap-2 mb-5 flex-wrap">
          {STAGES.map((s) => {
            const active = activeStage === s;
            const isDueStage = fu && fu.dueStage === s && !lead.sentDates[s];
            return (
              <button
                key={s}
                onClick={() => setActiveStage(s)}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  active ? "bg-[#12283C] text-white border-[#12283C] shadow-[0_2px_8px_rgba(18,40,60,0.25)]" : "bg-white border-[#E4E0D5] text-[#6B6355] hover:border-[#12283C]/30"
                }`}
              >
                {STAGE_LABEL[s]}
                {lead.sentDates[s] && <CheckCircle2 size={12} className="inline ml-1.5 -mt-0.5" />}
                {isDueStage && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: fu.daysOverdue > 0 ? BRAND_MAROON : "#D2691E" }} />}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3 mb-3">
          <Field label="Subject">
            <input value={lead.drafts[activeStage].subject} onChange={(e) => setDraft(activeStage, "subject", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Angle Used" hint={!lead.stageAngles?.[activeStage] && suggestedAngle ? `Try: ${suggestedAngle}` : undefined}>
            <Select value={lead.stageAngles?.[activeStage] || ""} onChange={(e) => setStageAngle(activeStage, e.target.value)}>
              <option value="">—</option>
              {(allAngleTypes || []).map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#8A8574] uppercase tracking-wider">Body</span>
            <div className="flex items-center gap-3">
              {!lead.drafts[activeStage].body.includes(`armanleads.com/r/${lead.id}`) && (
                <button
                  onClick={() => insertTrackedLink(activeStage)}
                  className="flex items-center gap-1 text-[11px] text-[#8A8574] hover:text-[#12283C] transition-colors"
                >
                  <Link2 size={11} /> Insert tracked link
                </button>
              )}
              <button
                onClick={() => setComposeExpanded(true)}
                className="flex items-center gap-1 text-[11px] text-[#8A8574] hover:text-[#12283C] transition-colors"
              >
                <Maximize2 size={11} /> Expand
              </button>
            </div>
          </div>
          <div className="mt-1.5">
            <textarea value={lead.drafts[activeStage].body} onChange={(e) => setDraft(activeStage, "body", e.target.value)} className={textareaCls} rows={16} />
          </div>
          <div className="text-[11px] font-mono mt-1.5 text-right transition-colors" style={{ color: wordCountColor }}>{wordCount} words</div>
        </div>

        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          {lead.sentDates[activeStage] ? (
            <>
              <span className="text-[11px] font-mono text-[#8A8574] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#2F6F62]" /> Sent {fmtDate(lead.sentDates[activeStage])}
              </span>
              <Button variant="secondary" size="md" onClick={() => setConfirmStage({ stage: activeStage, action: "undo" })}>
                <Undo2 size={13} /> Undo — not actually sent
              </Button>
            </>
          ) : (
            <>
              <span className="text-[11px] font-mono text-[#8A8574]">Not sent yet — draft autosaves</span>
              <Button
                variant="primary"
                size="md"
                onClick={() => setConfirmStage({ stage: activeStage, action: "send" })}
                disabled={!lead.drafts[activeStage].body}
              >
                <Send size={13} /> Mark {STAGE_LABEL[activeStage]} as Sent
              </Button>
            </>
          )}
        </div>
        <div className="mt-2.5 text-[11px] font-mono flex items-center gap-1.5" style={{ color: stageClickInfo ? "#2F6F62" : "#B8B2A0" }}>
          <MousePointerClick size={12} />
          {stageClickInfo
            ? `This email clicked${stageClickInfo.count > 1 ? ` ${stageClickInfo.count}x, most recently` : ""} ${fmtDateTime(stageClickInfo.last)}`
            : clickInfo?.count
              ? `Not clicked (${clickInfo.count} click${clickInfo.count > 1 ? "s" : ""} on other emails to this lead, pre-tracking format)`
              : "Not clicked yet"}
        </div>
      </SectionCard>

      {lead.activityLog && lead.activityLog.length > 0 && (
        <SectionCard icon={Clock} title="Activity">
          <div className="space-y-1.5 max-h-48 overflow-y-auto scroll-thin">
            {[...lead.activityLog].reverse().map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-[12px] py-1">
                <span className="text-[#6B6355]">{entry.action} — <span className="text-[#8A8574]">{entry.by}</span></span>
                <span className="font-mono text-[#B8B2A0] shrink-0">{fmtDateTime(entry.at)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <Modal open={composeExpanded} onClose={() => setComposeExpanded(false)} maxWidth="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-[#12283C]">{STAGE_LABEL[activeStage]} — {lead.name || "Unnamed clinic"}</h3>
          <Button variant="secondary" size="sm" onClick={() => setComposeExpanded(false)}>Done</Button>
        </div>
        <Field label="Subject" className="mb-3">
          <input value={lead.drafts[activeStage].subject} onChange={(e) => setDraft(activeStage, "subject", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Body">
          <textarea
            value={lead.drafts[activeStage].body}
            onChange={(e) => setDraft(activeStage, "body", e.target.value)}
            className={textareaCls + " min-h-[52vh]"}
            autoFocus
          />
        </Field>
        <div className="text-[11px] font-mono mt-1.5 text-right transition-colors" style={{ color: wordCountColor }}>{wordCount} words</div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this clinic?" maxWidth="max-w-sm">
        <p className="text-sm text-[#6B6355] mb-5">
          This permanently removes {lead.name ? <span className="font-medium text-[#12283C]">{lead.name}</span> : "this clinic"} and all of its drafts and history. This can't be undone.
        </p>
        <div className="flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="dangerSolid" onClick={onDelete}>Yes, delete</Button>
        </div>
      </Modal>

      <Modal
        open={!!confirmStage}
        onClose={() => setConfirmStage(null)}
        title={confirmStage?.action === "send" ? `Mark ${STAGE_LABEL[confirmStage?.stage] || ""} as sent?` : `Undo sent — ${STAGE_LABEL[confirmStage?.stage] || ""}?`}
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-[#6B6355] mb-3">
          {confirmStage?.action === "send"
            ? "This marks the email as actually sent and starts the follow-up countdown from today. Only confirm once you've actually sent it."
            : "This clears the sent date and reopens this stage for editing — use this if it got marked sent by mistake."}
        </p>
        {sendWarning.flagged && (
          <p className="flex items-start gap-1.5 text-[12px] mb-2" style={{ color: BRAND_MAROON }}>
            <ShieldAlert size={13} className="shrink-0 mt-[1px]" />
            <span>This draft may still contain personal/family content ("{sendWarning.matches[0]}") — double check before sending.</span>
          </p>
        )}
        {missingLinkWarning && (
          <p className="flex items-start gap-1.5 text-[12px] mb-4" style={{ color: BRAND_MAROON }}>
            <ShieldAlert size={13} className="shrink-0 mt-[1px]" />
            <span>
              No tracked link found in this body — clicks on this send won't be tracked.{" "}
              <button
                type="button"
                onClick={() => insertTrackedLink(confirmStage.stage)}
                className="underline decoration-dotted underline-offset-2 font-medium hover:opacity-70"
              >
                Insert it
              </button>
            </span>
          </p>
        )}
        <div className="flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={() => setConfirmStage(null)}>Cancel</Button>
          <Button
            variant={confirmStage?.action === "send" ? "primary" : "dangerSolid"}
            onClick={() => {
              if (confirmStage?.action === "send") onMarkSent(confirmStage.stage);
              else onUnmarkSent(confirmStage.stage);
              setConfirmStage(null);
            }}
          >
            {confirmStage?.action === "send" ? "Yes, mark as sent" : "Yes, undo"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
