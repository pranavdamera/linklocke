import { z } from 'zod'

export const AddEncounterSchema = z.object({
  run_id: z.string().uuid(),
  location_id: z.string().uuid(),
  player_id: z.string().uuid(),
  pokemon_name: z.string().min(1).max(50),
  species: z.string().max(50).optional(),
  pokedex_number: z.number().int().min(1).max(1010).optional(),
  nickname: z.string().max(50).optional().nullable(),
  level_met: z.number().int().min(1).max(100).optional().nullable(),
  level_current: z.number().int().min(1).max(100).optional().nullable(),
  gender: z.enum(['male', 'female', 'genderless', 'unknown']).optional().nullable(),
  ability: z.string().max(50).optional().nullable(),
  nature: z.string().max(20).optional().nullable(),
  sprite_url: z.string().url().optional().nullable(),
  types: z.array(z.string()).max(2).optional().nullable(),
  status: z.enum(['caught', 'missed', 'active', 'boxed', 'dead', 'released', 'champion']).default('caught'),
  is_shiny: z.boolean().default(false),
  is_gift: z.boolean().default(false),
  is_static: z.boolean().default(false),
  met_method: z.enum(['grass','surf','fishing','gift','static','dust_cloud','dark_grass','dark_dust_cloud','cave','water','other']).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type AddEncounterInput = z.infer<typeof AddEncounterSchema>

export const UpdateEncounterSchema = AddEncounterSchema.partial().extend({
  id: z.string().uuid(),
})

export type UpdateEncounterInput = z.infer<typeof UpdateEncounterSchema>

export const MissedEncounterSchema = z.object({
  run_id: z.string().uuid(),
  location_id: z.string().uuid(),
  player_id: z.string().uuid(),
  notes: z.string().max(500).optional().nullable(),
})

export type MissedEncounterInput = z.infer<typeof MissedEncounterSchema>
