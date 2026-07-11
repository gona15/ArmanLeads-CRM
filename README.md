# ArmanLeads Ledger — Setup Guide

A real, standalone CRM for you and your partner. No Claude account needed to use it once it's deployed.

## Step 1 — Create the free database (Supabase)

1. Go to supabase.com, sign up free, click "New Project."
2. Name it whatever (e.g. `armanleads`), set a database password (save it somewhere), pick the region closest to Iraq (likely Europe).
3. Once it's created, go to the **SQL Editor** (left sidebar) and run this:

```sql
create table armanleads_state (
  id text primary key,
  data jsonb,
  updated_at timestamp default now()
);

alter table armanleads_state enable row level security;

create policy "allow all for now"
on armanleads_state
for all
using (true)
with check (true);
```

That last policy makes the table readable/writable by anyone with your project's public key — fine since it's just the two of you and the URL isn't public. If you ever want it locked down further, tell me and I'll add real authentication.

4. Go to **Project Settings > API**. Copy the **Project URL** and the **anon public** key — you'll need both in Step 3.

## Step 2 — Get the code running

You'll need Node.js installed (nodejs.org, get the LTS version) if you don't have it already.

1. Unzip this project folder.
2. Open a terminal inside it and run:
   ```
   npm install
   ```
3. Copy `.env.example` to a new file named `.env`, and paste in your Supabase URL and anon key from Step 1.
4. Run it locally to test:
   ```
   npm run dev
   ```
   Open the localhost link it gives you — you should see the "Who's opening the ledger?" screen. Pick a name, add a test clinic, confirm it saves.

## Step 3 — Put it on the internet (Vercel, free)

1. Go to vercel.com, sign up free (you can use GitHub or just email).
2. Easiest path — install Vercel's CLI and deploy directly from your terminal:
   ```
   npm install -g vercel
   vercel
   ```
   Follow the prompts (link to a new project, accept defaults). When it asks about environment variables, or afterward in the Vercel dashboard under **Settings > Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (same values as your `.env` file)
3. Run `vercel --prod` to push the live version. You'll get a real URL like `armanleads-crm.vercel.app`.

Alternative if you don't want the CLI: push this folder to a GitHub repo, then on vercel.com click "Add New Project," import that repo, add the same two environment variables, deploy. Vercel auto-detects Vite and builds it correctly.

## Step 4 — Install it like an app

Send the Vercel URL to your partner. On both your phones:
- **iPhone (Safari):** open the link → Share button → "Add to Home Screen"
- **Android (Chrome):** open the link → ⋮ menu → "Add to Home Screen" / "Install app"

It'll sit on your home screen with an icon like a real app. Both of you editing shows up for the other person live (it uses Supabase realtime, no refresh needed).

## What "Both" queue-owner means
When Assigned To = "Both," the clinic shows up in both of your personal queues — useful for clinics that need a joint decision before moving forward.

## If something breaks
- Blank screen / console error about Supabase → double check your `.env` (locally) or Vercel env vars (live) match exactly, no extra spaces.
- Data not syncing between you two → confirm you're both pointed at the same Vercel URL, not one of you still running `localhost`.
