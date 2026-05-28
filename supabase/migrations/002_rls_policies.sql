-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.runs enable row level security;
alter table public.run_players enable row level security;
alter table public.locations enable row level security;
alter table public.run_locations enable row level security;
alter table public.encounter_links enable row level security;
alter table public.pokemon_encounters enable row level security;
alter table public.death_events enable row level security;
alter table public.activity_log enable row level security;
alter table public.rules enable row level security;
alter table public.badges enable row level security;

-- ============================================================
-- HELPER: check if user is member of a run
-- ============================================================
create or replace function public.is_run_member(p_run_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.run_players rp
    where rp.run_id = p_run_id
      and rp.profile_id = auth.uid()
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================
-- RUNS
-- ============================================================
create policy "runs_select_member" on public.runs
  for select using (public.is_run_member(id));

create policy "runs_insert_auth" on public.runs
  for insert with check (auth.role() = 'authenticated');

create policy "runs_update_member" on public.runs
  for update using (public.is_run_member(id));

-- ============================================================
-- RUN PLAYERS
-- ============================================================
create policy "run_players_select_member" on public.run_players
  for select using (public.is_run_member(run_id));

create policy "run_players_insert_member" on public.run_players
  for insert with check (public.is_run_member(run_id) or auth.role() = 'authenticated');

create policy "run_players_update_own" on public.run_players
  for update using (profile_id = auth.uid());

-- ============================================================
-- LOCATIONS (public read, no edit via RLS)
-- ============================================================
create policy "locations_select_all" on public.locations
  for select using (true);

-- ============================================================
-- RUN LOCATIONS
-- ============================================================
create policy "run_locations_select_member" on public.run_locations
  for select using (public.is_run_member(run_id));

create policy "run_locations_insert_member" on public.run_locations
  for insert with check (public.is_run_member(run_id));

create policy "run_locations_update_member" on public.run_locations
  for update using (public.is_run_member(run_id));

-- ============================================================
-- ENCOUNTER LINKS
-- ============================================================
create policy "encounter_links_select_member" on public.encounter_links
  for select using (public.is_run_member(run_id));

create policy "encounter_links_insert_member" on public.encounter_links
  for insert with check (public.is_run_member(run_id));

create policy "encounter_links_update_member" on public.encounter_links
  for update using (public.is_run_member(run_id));

-- ============================================================
-- POKEMON ENCOUNTERS
-- ============================================================
create policy "encounters_select_member" on public.pokemon_encounters
  for select using (public.is_run_member(run_id));

create policy "encounters_insert_own" on public.pokemon_encounters
  for insert with check (
    public.is_run_member(run_id) and player_id = auth.uid()
  );

create policy "encounters_update_member" on public.pokemon_encounters
  for update using (public.is_run_member(run_id));

-- ============================================================
-- DEATH EVENTS
-- ============================================================
create policy "death_events_select_member" on public.death_events
  for select using (public.is_run_member(run_id));

create policy "death_events_insert_member" on public.death_events
  for insert with check (public.is_run_member(run_id));

create policy "death_events_update_member" on public.death_events
  for update using (public.is_run_member(run_id));

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create policy "activity_select_member" on public.activity_log
  for select using (public.is_run_member(run_id));

create policy "activity_insert_member" on public.activity_log
  for insert with check (public.is_run_member(run_id));

-- ============================================================
-- RULES
-- ============================================================
create policy "rules_select_member" on public.rules
  for select using (public.is_run_member(run_id));

create policy "rules_insert_member" on public.rules
  for insert with check (public.is_run_member(run_id));

create policy "rules_update_member" on public.rules
  for update using (public.is_run_member(run_id));

-- ============================================================
-- BADGES
-- ============================================================
create policy "badges_select_member" on public.badges
  for select using (public.is_run_member(run_id));

create policy "badges_insert_member" on public.badges
  for insert with check (public.is_run_member(run_id));

create policy "badges_update_member" on public.badges
  for update using (public.is_run_member(run_id));

-- ============================================================
-- REALTIME PUBLICATIONS
-- ============================================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table
    public.pokemon_encounters,
    public.death_events,
    public.activity_log,
    public.run_locations,
    public.encounter_links,
    public.badges;
commit;
