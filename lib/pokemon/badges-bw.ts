export const UNOVA_BADGES = [
  { number: 1, name: 'Trio Badge',   leader: 'Cilan / Chili / Cress', city: 'Striaton City',  type: 'Grass/Fire/Water', description: 'Beat the Striaton triplets' },
  { number: 2, name: 'Basic Badge',  leader: 'Lenora',                city: 'Nacrene City',   type: 'Normal',          description: 'Beat the Nacrene City Gym Leader' },
  { number: 3, name: 'Insect Badge', leader: 'Burgh',                 city: 'Castelia City',  type: 'Bug',             description: 'Beat the Castelia City Gym Leader' },
  { number: 4, name: 'Bolt Badge',   leader: 'Elesa',                 city: 'Nimbasa City',   type: 'Electric',        description: 'Beat the Nimbasa City Gym Leader' },
  { number: 5, name: 'Quake Badge',  leader: 'Clay',                  city: 'Driftveil City', type: 'Ground',          description: 'Beat the Driftveil City Gym Leader' },
  { number: 6, name: 'Jet Badge',    leader: 'Skyla',                 city: 'Mistralton City',type: 'Flying',          description: 'Beat the Mistralton City Gym Leader' },
  { number: 7, name: 'Freeze Badge', leader: 'Brycen',                city: 'Icirrus City',   type: 'Ice',             description: 'Beat the Icirrus City Gym Leader' },
  { number: 8, name: 'Legend Badge', leader: 'Iris / Drayden',        city: 'Opelucid City',  type: 'Dragon',          description: 'Beat the Opelucid City Gym Leader' },
] as const

export type BadgeNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export function getBadgeByNumber(n: number) {
  return UNOVA_BADGES.find(b => b.number === n)
}
