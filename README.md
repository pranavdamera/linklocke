# Unova Linklocke Tracker

A 3-player Pokémon Black & White Linklocke tracker for P, Chach, and Cheek.

## Features

- **Linked Deaths** — Mark one Pokémon dead and the linked pair for the other two players auto-die
- **Route Tracker** — All Unova BW locations in order, with encounter slots per player
- **Realtime sync** — Supabase Realtime keeps all devices live
- **Graveyard** — Full death log with undo support
- **Rules panel** — Toggle dupes clause, shiny clause, hardcore mode, and more
- **Badge tracker** — 8 Unova gym badges with click-to-toggle
- **Mobile-first** — Designed for in-game use on your phone

---

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **anon key** (Settings → API)

### 2. Run Database Migrations

In your Supabase project → **SQL Editor**, paste and run each file in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/seed.sql
```

### 3. Enable Realtime

In Supabase Dashboard → **Database → Replication**, ensure these tables are enabled for realtime:
- `pokemon_encounters`
- `death_events`
- `activity_log`
- `run_locations`
- `encounter_links`
- `badges`

The `002_rls_policies.sql` migration creates the publication automatically, but you may need to toggle it in the dashboard.

### 4. Clone & Install

```bash
git clone <your-repo>
cd linklocke
npm install
```

### 5. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Inviting P, Chach, and Cheek

1. Each person goes to `/login` and creates an account (email + password or magic link)
2. First time on `/settings`, each person creates their profile and picks their **player slot** (1=P, 2=Chach, 3=Cheek)
3. The run creator creates the run at `/dashboard`
4. To add the other players to the run, run this SQL in Supabase SQL Editor after they sign up:

```sql
-- Get their user IDs from auth.users
-- Then insert into run_players:
INSERT INTO run_players (run_id, profile_id, player_name, slot, game_version)
VALUES 
  ('your-run-id', 'chach-user-id', 'Chach', 2, 'Black'),
  ('your-run-id', 'cheek-user-id', 'Cheek', 3, 'White');
```

---

## How Death Linking Works

1. Any player taps "💀 Dead" on any Pokémon at any route
2. A confirmation modal appears showing **all linked Pokémon** that will also die
3. Player types `KILL LINK` and confirms
4. The server action:
   - Creates a `death_event` record
   - Sets the trigger Pokémon status to `dead`
   - Finds all Pokémon in the same `encounter_link_id`
   - Sets all linked non-missed Pokémon to `dead`
   - Logs activity events for each linked death
5. Realtime updates push to all connected clients
6. A big "Linked Death Triggered" screen shows all casualties

To undo: go to `/graveyard`, find the death event, click the ↩ undo button (double-click to confirm).

---

## Deploy to Vercel

```bash
# Push to GitHub first, then:
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) and add environment variables in the Vercel dashboard.

Set these in Vercel → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your Vercel domain)

Also update Supabase Auth → **URL Configuration** → add your Vercel domain to the allowed redirect URLs.

---

## Resetting a Run

**Development only — this is destructive:**

```sql
-- Delete all encounters/deaths for a run
DELETE FROM pokemon_encounters WHERE run_id = 'your-run-id';
DELETE FROM death_events WHERE run_id = 'your-run-id';
DELETE FROM encounter_links WHERE run_id = 'your-run-id';
DELETE FROM activity_log WHERE run_id = 'your-run-id';
UPDATE run_locations SET status = 'available' WHERE run_id = 'your-run-id';
UPDATE badges SET obtained = false, obtained_at = null WHERE run_id = 'your-run-id';
UPDATE runs SET badge_count = 0 WHERE id = 'your-run-id';
```

---

## Pokémon Data

Sprites are loaded from PokéAPI's open CDN:
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
```

All 649 Gen 1–5 Pokémon names and types are included in `lib/pokemon/pokemon-data.ts`.

---

## Tech Stack

- **Next.js 14** App Router + Server Actions
- **Supabase** — Postgres, Auth, Realtime
- **TypeScript**
- **Tailwind CSS** + shadcn/ui components
- **Zod** validation
- **Sonner** toast notifications
- **PokéAPI sprites** (open CDN, no API key needed)
