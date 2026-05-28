'use server'

import { createServerClient } from '@/lib/supabase/server'
import { MarkDeadSchema, UndoDeathSchema } from '@/lib/validation/death'
import type { MarkDeadInput, UndoDeathInput } from '@/lib/validation/death'
import { revalidatePath } from 'next/cache'

export interface DeathResult {
  death_event_id: string
  trigger_pokemon: {
    id: string
    pokemon_name: string
    nickname: string | null
    player_id: string
    player_name: string
  }
  linked_casualties: {
    id: string
    pokemon_name: string
    nickname: string | null
    player_id: string
    player_name: string
    was_missed: boolean
  }[]
}

export async function markPokemonDead(input: MarkDeadInput): Promise<{ success: true; result: DeathResult } | { error: string }> {
  const parsed = MarkDeadSchema.safeParse(input)
  if (!parsed.success) {
    const errs = parsed.error.flatten()
    return { error: (errs as any)._root?.[0] ?? Object.values(errs.fieldErrors).flat()[0] ?? 'Invalid input' }
  }

  const { encounter_id, run_id, death_location, cause, opponent, notes } = parsed.data
  const supabase = createServerClient()

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch trigger encounter with player info
  const { data: triggerEncounter, error: fetchError } = await supabase
    .from('pokemon_encounters')
    .select(`
      id, pokemon_name, nickname, player_id, status,
      encounter_link_id, location_id,
      player:profiles(id, display_name, player_slot)
    `)
    .eq('id', encounter_id)
    .eq('run_id', run_id)
    .single()

  if (fetchError || !triggerEncounter) {
    return { error: 'Encounter not found' }
  }

  if (triggerEncounter.status === 'missed') {
    return { error: 'Cannot kill a missed encounter' }
  }

  if (triggerEncounter.status === 'dead') {
    return { error: 'This Pokémon is already dead' }
  }

  // Create death event
  const { data: deathEvent, error: deathError } = await supabase
    .from('death_events')
    .insert({
      run_id,
      trigger_encounter_id: encounter_id,
      trigger_player_id: triggerEncounter.player_id,
      location_id: triggerEncounter.location_id,
      death_location,
      cause,
      opponent,
      notes,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (deathError || !deathEvent) {
    return { error: 'Failed to create death event' }
  }

  // Fetch all encounters in the same link
  const { data: linkedEncounters, error: linkedError } = await supabase
    .from('pokemon_encounters')
    .select(`
      id, pokemon_name, nickname, player_id, status,
      player:profiles(id, display_name, player_slot)
    `)
    .eq('encounter_link_id', triggerEncounter.encounter_link_id)
    .eq('run_id', run_id)

  if (linkedError) {
    return { error: 'Failed to fetch linked encounters' }
  }

  // Kill all non-missed encounters in the link
  const toKill = linkedEncounters?.filter(e => e.status !== 'missed') ?? []
  const casualties: DeathResult['linked_casualties'] = []

  for (const enc of toKill) {
    await supabase
      .from('pokemon_encounters')
      .update({
        status: 'dead',
        previous_status: enc.status,
        death_event_id: deathEvent.id,
      })
      .eq('id', enc.id)

    const player = Array.isArray(enc.player) ? enc.player[0] : enc.player
    casualties.push({
      id: enc.id,
      pokemon_name: enc.pokemon_name,
      nickname: enc.nickname,
      player_id: enc.player_id,
      player_name: player?.display_name ?? 'Unknown',
      was_missed: false,
    })

    // Log linked death for non-trigger encounters
    if (enc.id !== encounter_id) {
      await supabase.from('activity_log').insert({
        run_id,
        actor_id: user.id,
        event_type: 'linked_death',
        entity_type: 'pokemon_encounter',
        entity_id: enc.id,
        message: `${enc.nickname ?? enc.pokemon_name} was killed by linked death (triggered by ${triggerEncounter.nickname ?? triggerEncounter.pokemon_name})`,
        metadata: { death_event_id: deathEvent.id, trigger_encounter_id: encounter_id },
      })
    }
  }

  // Log trigger death
  const triggerPlayer = Array.isArray(triggerEncounter.player) ? triggerEncounter.player[0] : triggerEncounter.player
  await supabase.from('activity_log').insert({
    run_id,
    actor_id: user.id,
    event_type: 'pokemon_died',
    entity_type: 'pokemon_encounter',
    entity_id: encounter_id,
    message: `${triggerEncounter.nickname ?? triggerEncounter.pokemon_name} fainted${cause ? ` — ${cause}` : ''}${opponent ? ` (vs ${opponent})` : ''}`,
    metadata: { death_event_id: deathEvent.id, cause, opponent, death_location },
  })

  // Update encounter link status if all linked are dead
  await supabase
    .from('encounter_links')
    .update({ status: 'dead' })
    .eq('id', triggerEncounter.encounter_link_id)

  revalidatePath('/routes')
  revalidatePath('/dashboard')
  revalidatePath('/graveyard')
  revalidatePath('/team')

  const result: DeathResult = {
    death_event_id: deathEvent.id,
    trigger_pokemon: {
      id: encounter_id,
      pokemon_name: triggerEncounter.pokemon_name,
      nickname: triggerEncounter.nickname,
      player_id: triggerEncounter.player_id,
      player_name: triggerPlayer?.display_name ?? 'Unknown',
    },
    linked_casualties: casualties.filter(c => c.id !== encounter_id),
  }

  return { success: true, result }
}

export async function undoDeath(input: UndoDeathInput): Promise<{ success: true } | { error: string }> {
  const parsed = UndoDeathSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const { death_event_id, run_id } = parsed.data
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch death event
  const { data: deathEvent } = await supabase
    .from('death_events')
    .select('id, is_undone')
    .eq('id', death_event_id)
    .eq('run_id', run_id)
    .single()

  if (!deathEvent) return { error: 'Death event not found' }
  if (deathEvent.is_undone) return { error: 'This death has already been undone' }

  // Get all encounters killed in this death event
  const { data: encounters } = await supabase
    .from('pokemon_encounters')
    .select('id, previous_status, encounter_link_id')
    .eq('death_event_id', death_event_id)
    .eq('run_id', run_id)

  if (!encounters?.length) return { error: 'No encounters found for this death event' }

  // Restore each encounter to previous status
  for (const enc of encounters) {
    await supabase
      .from('pokemon_encounters')
      .update({
        status: enc.previous_status ?? 'caught',
        death_event_id: null,
        previous_status: null,
      })
      .eq('id', enc.id)
  }

  // Restore encounter link status
  if (encounters[0]?.encounter_link_id) {
    await supabase
      .from('encounter_links')
      .update({ status: 'complete' })
      .eq('id', encounters[0].encounter_link_id)
  }

  // Mark death event as undone
  await supabase
    .from('death_events')
    .update({
      is_undone: true,
      undone_at: new Date().toISOString(),
      undone_by: user.id,
    })
    .eq('id', death_event_id)

  // Log undo
  await supabase.from('activity_log').insert({
    run_id,
    actor_id: user.id,
    event_type: 'undone',
    entity_type: 'death_event',
    entity_id: death_event_id,
    message: `Death event undone — Pokémon revived`,
    metadata: { death_event_id, restored_count: encounters.length },
  })

  revalidatePath('/routes')
  revalidatePath('/dashboard')
  revalidatePath('/graveyard')
  revalidatePath('/team')

  return { success: true }
}
