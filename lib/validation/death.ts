import { z } from 'zod'

export const MarkDeadSchema = z.object({
  encounter_id: z.string().uuid(),
  run_id: z.string().uuid(),
  death_location: z.string().max(100).optional().nullable(),
  cause: z.string().max(200).optional().nullable(),
  opponent: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type MarkDeadInput = z.infer<typeof MarkDeadSchema>

export const UndoDeathSchema = z.object({
  death_event_id: z.string().uuid(),
  run_id: z.string().uuid(),
})

export type UndoDeathInput = z.infer<typeof UndoDeathSchema>
