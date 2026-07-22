# ArmanLeads CRM Upgrade — Design

Status: proposed, awaiting review
Owner: Arman
Date: 2026-07-22

## 1. Goals

Arman asked for the CRM to become "way more functional, way more stunning, with better angle types and a lot more automation, all together, without introducing new bugs." This spec treats those as one coherent vision, built in safe, independently-shippable phases so the live tool never breaks for more than the length of one small change.

Non-goal: this spec does not cover rebuilding the public marketing site (armanleads.com) — CRM only.

## 2. Current state (confirmed by reading the live app + live data)

- **Stack:** Vite + React 18, Tailwind loaded via CDN `<script>` (not a build-time dependency), `@supabase/supabase-js`, `lucide-react` icons, `recharts` for charts. Hosted on Vercel, deployed from `github.com/gona15/ArmanLeads-CRM`.
- **Data model:** one Supabase table, `armanleads_state`, one row (`id="main"`), entire app state as a single JSON blob (`leads[]`, `dailyGoal`, `customAngleTypes`). Realtime sync via a Postgres changes subscription — this is already a genuine live-sync multi-user app, not just single-player.
- **Auth:** a client-side password gate (`PasswordGate.jsx`, checks `import.meta.env.VITE_APP_PASSWORD`) plus a lightweight "who am I" identity picker (`localStorage`, not real per-user auth) choosing between `Arman`, `Prusha`, `Both`.
- **Design system already in place:** Fraunces (serif, headings) + Inter (body) + JetBrains Mono (data/mono), a defined shadow scale (`card/raised/lift/popover`), deterministic per-person and per-clinic color assignment, a `.surface` card style, a full animation set with `prefers-reduced-motion` handled. This is a solid foundation, not a rough prototype — the redesign work here is refinement, not a rebuild.
- **Existing functionality:** Dashboard (today's sent count vs. daily goal, follow-ups due, drafts in progress, reply/conversion rate, status breakdown, angle-type reply-rate stats), Leads list with search/status/assignee filters, Lead detail view (all research fields + 4-stage draft editor + mark-sent), mobile nav. `computeFollowupState` already calculates which follow-up stage is due and how overdue it is, based on `sentDates` + fixed offsets (fu1 day 3, fu2 day 7, fu3 day 14).

## 3. Known issues to fix regardless of new features

1. **`VITE_APP_PASSWORD` was committed to git history** (commit `fc0d1d3`) on a public repo, later deleted from the working tree but still readable in history. Confirmed not the current live password (that lives in Vercel env vars), so not an active exposure — but the practice needs fixing so it doesn't happen with a real secret later.
2. **Row Level Security status on `armanleads_state` is unverified.** The app uses the anon key client-side (correct pattern), but the anon key itself ships inside the public JS bundle, which is normal *only if* RLS + policies actually restrict what that key can do. Action: Arman confirms RLS status in the Supabase dashboard before Phase 1 ships. If RLS is off, Phase 1 includes turning it on with a policy scoped to the single `id="main"` row.
3. **Tailwind via CDN script**, not a real build dependency — no purging, no custom config/tokens file, larger runtime cost than a compiled build. Low priority, but cheap to fix while touching the visual layer anyway (Phase 2).
4. **`"Personal/Family"` is a built-in angle type** in `DEFAULT_ANGLE_TYPES` (`src/lib/constants.js`) — directly conflicts with the standing rule that personal/family details about a prospect are never used in outreach. Removed in Phase 1.

## 4. Phase 1 — Data model & angle types (foundation)

- Replace `DEFAULT_ANGLE_TYPES` with the six angle types from the actual SMYKM/PPC outreach methodology already in use: **Industry Peer, Reviews & Reputation, Community/Local, Content/Social, Competitive Landscape, Business Model/Bandwidth.** These are persuasion angles (why the reader replies), which is what the dashboard's angle-reply-rate stat should be measuring — the old list mixed in content triggers (`Recent Post`, `Award/Milestone`) which measure something different and diluted the stat.
- Add a lightweight **ethics guard**: a pure client-side keyword/pattern check (no AI call, no new infra) that flags likely personal/family content in `smykNotes` or `drafts` (family-relation words, age + minor-context patterns, birthday mentions) with a visible warning badge on the lead — doesn't block saving, just surfaces it so it can't slip into a draft unnoticed, the way it did with the Spellman lead.
- Add `gmailThreadId` (nullable string) to the lead schema, unused until Phase 4 (reply detection) — added now so the schema migration happens once, not twice.
- Add a per-lead `activityLog` array (`{ at, by, action }`), append-only, populated by existing update paths — groundwork for the "who did what" visibility Phase 3 needs once two people are working the same list.

Migration approach: since state is one JSON blob, this is a values-only migration (map over `leads[]`, drop the field/set new defaults) run once via a script against Supabase, not a schema/DDL change. Reversible by keeping a timestamped backup of the blob before writing.

## 5. Phase 2 — Visual refinement

Keep the existing base (cream `#F5F3EC`, forest green `#2F6F62`/`#1F5C4E`, navy `#12283C` text, Fraunces/Inter pairing) — it already works. Changes:

- Introduce the public-site maroon (`#7A1F2B`) as a **targeted accent only**: overdue-follow-up indicators, primary action buttons, the daily-goal progress state when behind — not a base color, so the daily-use tool doesn't become visually heavy.
- Rework the Dashboard's visual hierarchy so "what needs you today" (overdue follow-ups, unfinished drafts) is the first thing seen, not just another card among equals — the data (`followupsDue`, `draftsInProgress`) already exists, this is a layout/emphasis change, not new logic.
- Migrate Tailwind from the CDN script to a proper Vite build dependency with a config file, using the existing colors/shadows/fonts as defined tokens instead of ad hoc inline styles + a `<style>` block. Purely internal — should be visually invisible, i.e. a true no-behavior-change refactor, done first in this phase and verified with a visual diff before anything else in Phase 2 lands on top of it.

## 6. Phase 3 — New features

- **Bulk import** — paste or upload a list of prospects (name/city/website at minimum) instead of one-at-a-time entry.
- **"Today" view** — a single filtered view combining overdue follow-ups + in-progress drafts + anything added since the last visit, for daily triage.
- **Duplicate guard** — warn on add if name+city (fuzzy match) already exists in `leads`.
- **Activity log display** — surface the Phase 1 `activityLog` on the lead detail view (who last touched what, when) — matters now that Arman and Prusha both work the same list.
- **Angle-type performance panel** — extend the existing `angleStats` dashboard chart into an explicit ranked list ("Competitive Landscape: 40% reply, 5 sent" etc.) so angle choice for a new lead can be informed by what's actually worked.

Open question for Arman, not blocking Phase 1/2: is Prusha a partner working leads with full access, or an assistant with a narrower role? Default assumption below is "same access, just tracked separately for visibility" (no hard permission walls) — cheap to change later if wrong, since nothing before Phase 3 depends on the answer.

## 7. Phase 4 — Automation (Tier 1 only, see note in section 8)

- **Draft generation, session-driven:** Arman asks (in a Claude Code session), Claude reads a lead's `smykNotes` + `angleType` from Supabase, applies the SMYKM/PPC methodology + a stop-slop pass, writes the result into that lead's `drafts` field via the existing Supabase connection. No new infrastructure — this already works today, ahead of any code changes.
- **Push to Gmail, session-driven:** same trigger, creates the matching Gmail draft via the existing Gmail MCP connection. Also already possible today.
- **CRM-side support for the above:** a "Draft Ready for Claude" status/flag a lead can be marked with, so Arman can mark several leads at once and ask Claude to work through the queue in one pass, rather than naming each one individually.
- **Follow-up staging:** when `computeFollowupState` flags a lead as due, surface which angle type hasn't been used yet for that lead (rotate through the six types across initial + 3 follow-ups) so the next draft's angle is suggested, not guessed fresh each time.
- **Reply check, session-driven:** Arman asks ("check for replies"), Claude searches Gmail by each lead's `gmailThreadId` (set when a draft is pushed to Gmail) via the existing Gmail connection, and updates `repliedDate`/`status` in Supabase for any that show a reply. Same Tier 1 pattern as the rest of this phase — asked-for, not backgrounded.

## 8. Automation Tier 2 (explicitly out of scope for this spec)

A version where the live website itself calls an AI and Gmail directly, with no Claude session involved, is a separate, larger project: needs a backend function, an LLM API key with a real per-call cost, and a Gmail OAuth integration on the server side. Not included here. Revisit only if Tier 1's session-driven flow turns out to be too much manual triggering in practice.

## 9. Rollout & risk

Each phase ships as its own small, testable change against the live app — Phase 1 (data-only, verified against real Supabase data before UI changes), Phase 2 (visual, verified with the Tailwind migration isolated first), Phase 3 (additive features), Phase 4 (uses what's already connected, no new infra). No phase depends on guessing what a later phase will need beyond the two fields added early in Phase 1 for that reason. Rolling back any single phase means reverting that phase's commits — earlier phases keep working.

## 10. Explicitly not doing

- No real multi-user authentication system (email/password per person) — the lightweight identity picker stays, this isn't a security boundary, it's attribution.
- No Tier 2 automation (see section 8).
- No change to the public marketing site.
