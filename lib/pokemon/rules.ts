export interface RuleTemplate {
  key: string
  label: string
  description: string
  defaultEnabled: boolean
  category: 'standard' | 'clause' | 'hardcore' | 'location'
}

export const RULES_TEMPLATE: RuleTemplate[] = [
  // Standard Nuzlocke
  { key: 'first_encounter_only',  label: 'First Encounter Only',      description: 'Only the first Pokémon encountered in each area may be caught.',                                          defaultEnabled: true,  category: 'standard' },
  { key: 'mandatory_nickname',    label: 'Mandatory Nicknames',        description: 'Every caught Pokémon must be given a nickname.',                                                           defaultEnabled: true,  category: 'standard' },
  { key: 'permadeath',            label: 'Permadeath',                 description: 'If a Pokémon faints it is considered dead and must be permanently boxed or released.',                     defaultEnabled: true,  category: 'standard' },
  // Linklocke
  { key: 'linked_deaths',         label: 'Linked Deaths',              description: 'If one Pokémon in a linked trio dies, the corresponding Pokémon for the other two players also die.',      defaultEnabled: true,  category: 'standard' },
  // Clauses
  { key: 'dupes_clause',          label: 'Dupes Clause',               description: 'If the first encounter is a species you already have (or had), you may skip it and try again.',           defaultEnabled: false, category: 'clause'   },
  { key: 'species_clause',        label: 'Species Clause',             description: 'You may not have two of the same species alive at the same time.',                                         defaultEnabled: false, category: 'clause'   },
  { key: 'shiny_clause',          label: 'Shiny Clause',               description: 'Shiny Pokémon may always be caught regardless of other rules.',                                            defaultEnabled: false, category: 'clause'   },
  { key: 'gift_counts',           label: 'Gift Pokémon Count',         description: 'Gift Pokémon count as your encounter for that location/route.',                                            defaultEnabled: false, category: 'clause'   },
  { key: 'static_counts',         label: 'Static Pokémon Count',       description: 'Static encounters count as your encounter for that location/route.',                                       defaultEnabled: false, category: 'clause'   },
  // Hardcore
  { key: 'set_mode',              label: 'Set Mode',                   description: 'Battle style is always Set — you cannot switch Pokémon after the opponent\'s Pokémon faints.',            defaultEnabled: false, category: 'hardcore' },
  { key: 'no_items_battle',       label: 'No Items in Battle',         description: 'Items may not be used during battles (Poké Balls are allowed for catching).',                             defaultEnabled: false, category: 'hardcore' },
  { key: 'whiteout_run_loss',     label: 'Whiteout = Run Loss',        description: 'If your entire team is wiped out, the run is over.',                                                       defaultEnabled: false, category: 'hardcore' },
  { key: 'level_cap',             label: 'Level Cap (Gym Leaders)',     description: 'Your Pokémon may not be leveled above the next Gym Leader\'s ace, enforced on honor system.',            defaultEnabled: false, category: 'hardcore' },
  // Location-specific
  { key: 'pinwheel_split',        label: 'Pinwheel Forest Split',      description: 'Pinwheel Forest Inner and Outer are treated as separate encounter areas.',                                 defaultEnabled: false, category: 'location' },
  { key: 'dragonspiral_floors',   label: 'Dragonspiral Tower Floors',  description: 'Each floor of Dragonspiral Tower is a separate encounter area.',                                          defaultEnabled: false, category: 'location' },
  { key: 'desert_relic_split',    label: 'Desert Resort / Relic Split','description': 'Desert Resort and Relic Castle are treated as separate encounter areas.',                               defaultEnabled: false, category: 'location' },
]

export function getDefaultRules() {
  return RULES_TEMPLATE.map(r => ({
    key: r.key,
    label: r.label,
    description: r.description,
    enabled: r.defaultEnabled,
  }))
}
