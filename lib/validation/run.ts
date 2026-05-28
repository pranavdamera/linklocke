import { z } from 'zod'

export const CreateRunSchema = z.object({
  name: z.string().min(1).max(100),
  game: z.string().default('pokemon_black_white'),
  region: z.string().default('unova'),
  players: z.array(z.object({
    profile_id: z.string().uuid(),
    player_name: z.string().min(1).max(50),
    slot: z.number().int().min(1).max(3),
    game_version: z.enum(['Black', 'White']),
  })).min(1).max(3),
})

export type CreateRunInput = z.infer<typeof CreateRunSchema>

export const UpdateBadgeSchema = z.object({
  run_id: z.string().uuid(),
  badge_number: z.number().int().min(1).max(8),
  obtained: z.boolean(),
  notes: z.string().max(200).optional().nullable(),
})

export type UpdateBadgeInput = z.infer<typeof UpdateBadgeSchema>

export const UpdateRuleSchema = z.object({
  run_id: z.string().uuid(),
  key: z.string().min(1),
  enabled: z.boolean(),
})

export type UpdateRuleInput = z.infer<typeof UpdateRuleSchema>
