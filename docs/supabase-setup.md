# Connecting Supabase

Until you do this, Studiolo stores everything in one browser on one machine.
After it, your library lives in your account and follows you between devices.
The app works either way — the switch is the presence of two env vars.

## 1. Create the project

At [supabase.com](https://supabase.com) → **New project**. Any region near you.
Save the database password somewhere; you won't need it for this, but you will
eventually.

## 2. Create the tables

**SQL Editor → New query**, paste the whole of `supabase/schema.sql`, run it.
It is safe to run more than once.

This creates four tables — faculties, creators, courses, lessons — with row
level security switched on, so a row is only ever visible to the account that
owns it. It also builds a full-text index over lesson titles, transcripts,
lesson text and notes, which is what "ask across the library" will search.

## 3. Get the two values

**Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Both are meant to be public and shipped to the browser. Row level security is
what protects the data, not secrecy of the key. The `service_role` key on that
same page is the opposite — it bypasses every policy, so it must never go in
any `NEXT_PUBLIC_` variable or anywhere near the browser.

## 4. Tell the app

**Locally** — copy `.env.example` to `.env.local` and fill in both values.

**On Vercel** — Project → Settings → Environment Variables, add both, then
redeploy (Deployments → newest → Redeploy) so the build picks them up.

## 5. Sign in and move your library up

The app now asks for an email and sends a sign-in link — no password. Open the
link on the same device.

Once inside, go to **Settings → Move this browser's library into your account**.
It reads whatever is still stored locally and merges it up. Run it once.

> Supabase sends a limited number of auth emails per hour on the free plan. For
> a personal tool that is plenty; if you hit it, wait an hour or add your own
> SMTP under Authentication → Emails.

## What it costs

The free plan gives 500 MB of database. All 22 SPI courses as text come to
roughly 5 MB, so space is not the constraint — about 1% of it.

The real constraint is that **free projects pause after 7 days without
activity**, and waking one takes a few minutes. For something you open most
days that is invisible; for something you touch monthly it is a daily-use
annoyance. Pro is $25/month and doesn't pause.

Start on free. You will know within a fortnight whether the pausing actually
bites, and upgrading is one click with no migration.
