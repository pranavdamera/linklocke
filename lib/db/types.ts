// ============================================================
// DATABASE TYPES
// ============================================================

export type PlayerSlot = 1 | 2 | 3

export type RunStatus = 'active' | 'completed' | 'failed' | 'paused'

export type LocationType =
  | 'route' | 'city' | 'cave' | 'forest' | 'desert' | 'tower'
  | 'bridge' | 'building' | 'gift' | 'static' | 'water' | 'other'

export type RunLocationStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped'

export type EncounterLinkStatus = 'open' | 'complete' | 'broken' | 'dead'

export type PokemonStatus =
  | 'caught' | 'missed' | 'active' | 'boxed' | 'dead' | 'released' | 'champion'

export type PokemonGender = 'male' | 'female' | 'genderless' | 'unknown'

export type MetMethod =
  | 'grass' | 'surf' | 'fishing' | 'gift' | 'static' | 'dust_cloud'
  | 'dark_grass' | 'dark_dust_cloud' | 'cave' | 'water' | 'other'

export type ActivityEventType =
  | 'encounter_added' | 'encounter_updated' | 'encounter_missed'
  | 'pokemon_died' | 'linked_death' | 'revived' | 'undone'
  | 'badge_update' | 'settings_update' | 'location_complete'
  | 'run_created' | 'run_reset' | 'rule_toggled'

// ============================================================
// TABLE TYPES
// ============================================================

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  player_slot: PlayerSlot
  friend_code: string | null
  theme_color: string | null
  created_at: string
}

export interface Run {
  id: string
  name: string
  game: string
  region: string
  status: RunStatus
  badge_count: number
  current_location_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RunPlayer {
  id: string
  run_id: string
  profile_id: string
  player_name: string
  slot: PlayerSlot
  game_version: 'Black' | 'White'
  is_active: boolean
  created_at: string
}

export interface Location {
  id: string
  game: string
  region: string
  name: string
  slug: string
  location_type: LocationType
  order_index: number
  badge_gate: number | null
  is_optional: boolean
  is_encounter_area: boolean
  notes: string | null
}

export interface RunLocation {
  id: string
  run_id: string
  location_id: string
  status: RunLocationStatus
  completed_at: string | null
  created_at: string
}

export interface EncounterLink {
  id: string
  run_id: string
  location_id: string
  link_number: number
  status: EncounterLinkStatus
  created_at: string
  updated_at: string
}

export interface PokemonEncounter {
  id: string
  run_id: string
  encounter_link_id: string
  player_id: string
  location_id: string
  pokemon_name: string
  species: string | null
  pokedex_number: number | null
  nickname: string | null
  level_met: number | null
  level_current: number | null
  gender: PokemonGender | null
  ability: string | null
  nature: string | null
  sprite_url: string | null
  types: string[] | null
  status: PokemonStatus
  is_shiny: boolean
  is_gift: boolean
  is_static: boolean
  met_method: MetMethod | null
  notes: string | null
  death_event_id: string | null
  previous_status: string | null
  caught_at: string
  updated_at: string
}

export interface DeathEvent {
  id: string
  run_id: string
  trigger_encounter_id: string | null
  trigger_player_id: string | null
  location_id: string | null
  death_location: string | null
  cause: string | null
  opponent: string | null
  notes: string | null
  is_undone: boolean
  undone_at: string | null
  undone_by: string | null
  created_at: string
  created_by: string | null
}

export interface ActivityLog {
  id: string
  run_id: string
  actor_id: string | null
  event_type: ActivityEventType
  entity_type: string | null
  entity_id: string | null
  message: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Rule {
  id: string
  run_id: string
  key: string
  label: string
  description: string | null
  enabled: boolean
  created_at: string
}

export interface Badge {
  id: string
  run_id: string
  badge_number: number
  name: string
  leader: string
  city: string
  type_specialty: string | null
  obtained: boolean
  obtained_at: string | null
  notes: string | null
}

// ============================================================
// JOINED / ENRICHED TYPES
// ============================================================

export interface ProfileWithStats extends Profile {
  alive_count: number
  dead_count: number
  boxed_count: number
  missed_count: number
  champion_count: number
}

export interface RunPlayerWithProfile extends RunPlayer {
  profile: Profile
}

export interface PokemonEncounterWithPlayer extends PokemonEncounter {
  player: Profile
  location: Location
}

export interface DeathEventWithEncounters extends DeathEvent {
  trigger_encounter: PokemonEncounterWithPlayer | null
  trigger_player: Profile | null
  linked_encounters: PokemonEncounterWithPlayer[]
  location: Location | null
}

export interface EncounterLinkWithEncounters extends EncounterLink {
  location: Location
  encounters: PokemonEncounterWithPlayer[]
}

export interface RunWithPlayers extends Run {
  run_players: RunPlayerWithProfile[]
}

export interface RunLocationWithLocation extends RunLocation {
  location: Location
  encounter_link: EncounterLinkWithEncounters | null
}

// ============================================================
// FORM / ACTION INPUT TYPES
// ============================================================

export interface AddEncounterInput {
  run_id: string
  location_id: string
  player_id: string
  pokemon_name: string
  species?: string
  pokedex_number?: number
  nickname?: string
  level_met?: number
  gender?: PokemonGender
  ability?: string
  nature?: string
  sprite_url?: string
  types?: string[]
  status: PokemonStatus
  is_shiny?: boolean
  is_gift?: boolean
  is_static?: boolean
  met_method?: MetMethod
  notes?: string
}

export interface MarkDeadInput {
  encounter_id: string
  run_id: string
  death_location?: string
  cause?: string
  opponent?: string
  notes?: string
}

export interface UndoDeathInput {
  death_event_id: string
  run_id: string
}

// ============================================================
// UI / DISPLAY TYPES
// ============================================================

export const PLAYER_NAMES: Record<PlayerSlot, string> = {
  1: 'P',
  2: 'Chach',
  3: 'Cheek',
}

export const PLAYER_COLORS: Record<PlayerSlot, string> = {
  1: '#60a5fa', // blue-400
  2: '#4ade80', // green-400
  3: '#c084fc', // purple-400
}

export const STATUS_COLORS: Record<PokemonStatus, string> = {
  caught: '#60a5fa',
  missed: '#fbbf24',
  active: '#60a5fa',
  boxed: '#9ca3af',
  dead: '#f87171',
  released: '#6b7280',
  champion: '#fde68a',
}

export const STATUS_LABELS: Record<PokemonStatus, string> = {
  caught: 'Caught',
  missed: 'Missed',
  active: 'Active',
  boxed: 'Boxed',
  dead: 'Dead',
  released: 'Released',
  champion: 'Champion',
}

export const POKEMON_TYPES = [
  'Normal','Fire','Water','Grass','Electric','Ice',
  'Fighting','Poison','Ground','Flying','Psychic','Bug',
  'Rock','Ghost','Dark','Dragon','Steel','Fairy'
] as const

export type PokemonType = typeof POKEMON_TYPES[number]

export const TYPE_COLORS: Record<string, string> = {
  Normal: '#A8A878', Fire: '#F08030', Water: '#6890F0',
  Grass: '#78C850', Electric: '#F8D030', Ice: '#98D8D8',
  Fighting: '#C03028', Poison: '#A040A0', Ground: '#E0C068',
  Flying: '#A890F0', Psychic: '#F85888', Bug: '#A8B820',
  Rock: '#B8A038', Ghost: '#705898', Dark: '#705848',
  Dragon: '#7038F8', Steel: '#B8B8D0', Fairy: '#EE99AC',
}

export const NATURES = [
  'Hardy','Lonely','Brave','Adamant','Naughty',
  'Bold','Docile','Relaxed','Impish','Lax',
  'Timid','Hasty','Serious','Jolly','Naive',
  'Modest','Mild','Quiet','Bashful','Rash',
  'Calm','Gentle','Sassy','Careful','Quirky'
] as const
