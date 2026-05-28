-- Enable UUID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  player_slot int not null unique check (player_slot in (1, 2, 3)),
  friend_code text,
  theme_color text default '#60a5fa',
  created_at timestamptz default now()
);

comment on table public.profiles is 'One row per player (P=1, Chach=2, Cheek=3). Linked to auth.users.';

-- ============================================================
-- RUNS
-- ============================================================
create table public.runs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  game text not null default 'pokemon_black_white',
  region text not null default 'unova',
  status text not null default 'active' check (status in ('active','completed','failed','paused')),
  badge_count int default 0,
  current_location_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RUN PLAYERS (membership)
-- ============================================================
create table public.run_players (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  player_name text not null,
  slot int not null check (slot in (1, 2, 3)),
  game_version text not null default 'Black' check (game_version in ('Black', 'White')),
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(run_id, slot),
  unique(run_id, profile_id)
);

-- ============================================================
-- LOCATIONS (Unova BW)
-- ============================================================
create table public.locations (
  id uuid primary key default uuid_generate_v4(),
  game text not null default 'pokemon_black_white',
  region text not null default 'unova',
  name text not null,
  slug text not null unique,
  location_type text not null check (location_type in (
    'route','city','cave','forest','desert','tower',
    'bridge','building','gift','static','water','other'
  )),
  order_index int not null,
  badge_gate int,
  is_optional boolean default false,
  is_encounter_area boolean default true,
  notes text
);

create index idx_locations_order on public.locations(order_index);
create index idx_locations_game on public.locations(game);

-- ============================================================
-- RUN LOCATIONS (per-run state of each location)
-- ============================================================
create table public.run_locations (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  location_id uuid not null references public.locations(id),
  status text not null default 'locked' check (status in (
    'locked','available','in_progress','completed','skipped'
  )),
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(run_id, location_id)
);

create index idx_run_locations_run on public.run_locations(run_id);

-- ============================================================
-- ENCOUNTER LINKS (one per route per run, links all 3 players)
-- ============================================================
create table public.encounter_links (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  location_id uuid not null references public.locations(id),
  link_number int not null default 1,
  status text not null default 'open' check (status in ('open','complete','broken','dead')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(run_id, location_id)
);

create index idx_encounter_links_run on public.encounter_links(run_id);
create index idx_encounter_links_location on public.encounter_links(run_id, location_id);

-- ============================================================
-- POKEMON ENCOUNTERS
-- ============================================================
create table public.pokemon_encounters (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  encounter_link_id uuid not null references public.encounter_links(id) on delete cascade,
  player_id uuid not null references public.profiles(id),
  location_id uuid not null references public.locations(id),
  pokemon_name text not null,
  species text,
  pokedex_number int,
  nickname text,
  level_met int,
  level_current int,
  gender text check (gender in ('male','female','genderless','unknown')),
  ability text,
  nature text,
  sprite_url text,
  types text[],
  status text not null default 'caught' check (status in (
    'caught','missed','active','boxed','dead','released','champion'
  )),
  is_shiny boolean default false,
  is_gift boolean default false,
  is_static boolean default false,
  met_method text check (met_method in (
    'grass','surf','fishing','gift','static','dust_cloud','dark_grass',
    'dark_dust_cloud','cave','water','other'
  )),
  notes text,
  death_event_id uuid,
  previous_status text,
  caught_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(run_id, location_id, player_id)
);

create index idx_encounters_run on public.pokemon_encounters(run_id);
create index idx_encounters_link on public.pokemon_encounters(encounter_link_id);
create index idx_encounters_player on public.pokemon_encounters(player_id);
create index idx_encounters_status on public.pokemon_encounters(status);

-- ============================================================
-- DEATH EVENTS
-- ============================================================
create table public.death_events (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  trigger_encounter_id uuid references public.pokemon_encounters(id),
  trigger_player_id uuid references public.profiles(id),
  location_id uuid references public.locations(id),
  death_location text,
  cause text,
  opponent text,
  notes text,
  is_undone boolean default false,
  undone_at timestamptz,
  undone_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);

create index idx_death_events_run on public.death_events(run_id);
create index idx_death_events_trigger on public.death_events(trigger_encounter_id);

-- Add FK after both tables exist
alter table public.pokemon_encounters
  add constraint fk_death_event
  foreign key (death_event_id) references public.death_events(id);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null check (event_type in (
    'encounter_added','encounter_updated','encounter_missed',
    'pokemon_died','linked_death','revived','undone',
    'badge_update','settings_update','location_complete',
    'run_created','run_reset','rule_toggled'
  )),
  entity_type text,
  entity_id uuid,
  message text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index idx_activity_run on public.activity_log(run_id);
create index idx_activity_created on public.activity_log(created_at desc);

-- ============================================================
-- RULES
-- ============================================================
create table public.rules (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  key text not null,
  label text not null,
  description text,
  enabled boolean default false,
  created_at timestamptz default now(),
  unique(run_id, key)
);

-- ============================================================
-- BADGES
-- ============================================================
create table public.badges (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  badge_number int not null check (badge_number between 1 and 8),
  name text not null,
  leader text not null,
  city text not null,
  type_specialty text,
  obtained boolean default false,
  obtained_at timestamptz,
  notes text,
  unique(run_id, badge_number)
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_runs_updated_at
  before update on public.runs
  for each row execute function update_updated_at();

create trigger trg_encounters_updated_at
  before update on public.pokemon_encounters
  for each row execute function update_updated_at();

create trigger trg_encounter_links_updated_at
  before update on public.encounter_links
  for each row execute function update_updated_at();
