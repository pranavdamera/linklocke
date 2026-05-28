'use server'

import { createServerClient } from '@/lib/supabase/server'
import { AddEncounterSchema, UpdateEncounterSchema, MissedEncounterSchema } from '@/lib/validation/encounter'
import type { AddEncounterInput, UpdateEncounterInput, MissedEncounterInput } from '@/lib/validation/encounter'
import { getPokemonByName } from '@/lib/pokemon/pokemon-data'
import { revalidatePath } from 'next/cache'

export async function addEncounter(input: AddEncounterInput) {
  const parsed = AddEncounterSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = createServerClient()
  const data = parsed.data

  // Auto-fill Pokémon data from our dataset if not provided
  if (!data.pokedex_number || !data.types) {
    const pokemon = getPokemonByName(data.pokemon_name)
    if (pokemon) {
      data.pokedex_number ??= pokemon.id
      data.types ??= pokemon.types as string[]
      data.species ??= pokemon.name
      if (!data.sprite_url) {
        data.sprite_url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
      }
    }
  }

  // Find or create the encounter_link for this run + location
  let { data: link, error: linkError } = await supabase
    .from('encounter_links')
    .select('id')
    .eq('run_id', data.run_id)
    .eq('location_id', data.location_id)
    .single()

  if (linkError || !link) {
    const { data: newLink, error: createLinkError } = await supabase
      .from('encounter_links')
      .insert({
        run_id: data.run_id,
        location_id: data.location_id,
        link_number: 1,
        status: 'open',
      })
      .select('id')
      .single()

    if (createLinkError || !newLink) {
      return { error: { _root: ['Failed to create encounter link'] } }
    }
    link = newLink
  }

  // Check if player already has an encounter at this location
  const { data: existing } = await supabase
    .from('pokemon_encounters')
    .select('id')
    .eq('run_id', data.run_id)
    .eq('location_id', data.location_id)
    .eq('player_id', data.player_id)
    .single()

  if (existing) {
    // Update instead
    const { error } = await supabase
      .from('pokemon_encounters')
      .update({
        pokemon_name: data.pokemon_name,
        species: data.species,
        pokedex_number: data.pokedex_number,
        nickname: data.nickname,
        level_met: data.level_met,
        level_current: data.level_current,
        gender: data.gender,
        ability: data.ability,
        nature: data.nature,
        sprite_url: data.sprite_url,
        types: data.types,
        status: data.status,
        is_shiny: data.is_shiny,
        is_gift: data.is_gift,
        is_static: data.is_static,
        met_method: data.met_method,
        notes: data.notes,
      })
      .eq('id', existing.id)

    if (error) return { error: { _root: [error.message] } }

    await logActivity(supabase, {
      run_id: data.run_id,
      actor_id: data.player_id,
      event_type: 'encounter_updated',
      entity_type: 'pokemon_encounter',
      entity_id: existing.id,
      message: `Updated ${data.nickname ?? data.pokemon_name} encounter`,
    })

    revalidatePath('/routes')
    revalidatePath('/dashboard')
    return { success: true, id: existing.id }
  }

  // Insert new encounter
  const { data: encounter, error } = await supabase
    .from('pokemon_encounters')
    .insert({
      run_id: data.run_id,
      encounter_link_id: link.id,
      player_id: data.player_id,
      location_id: data.location_id,
      pokemon_name: data.pokemon_name,
      species: data.species,
      pokedex_number: data.pokedex_number,
      nickname: data.nickname,
      level_met: data.level_met,
      level_current: data.level_current,
      gender: data.gender,
      ability: data.ability,
      nature: data.nature,
      sprite_url: data.sprite_url,
      types: data.types,
      status: data.status,
      is_shiny: data.is_shiny,
      is_gift: data.is_gift,
      is_static: data.is_static,
      met_method: data.met_method,
      notes: data.notes,
    })
    .select('id')
    .single()

  if (error || !encounter) {
    return { error: { _root: [error?.message ?? 'Failed to add encounter'] } }
  }

  // Log activity
  await logActivity(supabase, {
    run_id: data.run_id,
    actor_id: data.player_id,
    event_type: data.status === 'missed' ? 'encounter_missed' : 'encounter_added',
    entity_type: 'pokemon_encounter',
    entity_id: encounter.id,
    message: data.status === 'missed'
      ? `Missed encounter at location`
      : `Caught ${data.nickname ?? data.pokemon_name}${data.is_shiny ? ' ✨' : ''}`,
    metadata: { pokemon_name: data.pokemon_name, location_id: data.location_id },
  })

  // Check if the encounter link is now complete (all 3 players have entries)
  await checkAndCompleteLink(supabase, link.id, data.run_id, data.location_id)

  revalidatePath('/routes')
  revalidatePath('/dashboard')
  revalidatePath('/team')

  return { success: true, id: encounter.id }
}

export async function markMissed(input: MissedEncounterInput) {
  return addEncounter({
    ...input,
    pokemon_name: 'Missed',
    status: 'missed',
    is_shiny: false,
    is_gift: false,
    is_static: false,
  })
}

async function checkAndCompleteLink(
  supabase: ReturnType<typeof createServerClient>,
  linkId: string,
  runId: string,
  locationId: string
) {
  const { data: encounters } = await supabase
    .from('pokemon_encounters')
    .select('status')
    .eq('encounter_link_id', linkId)

  if (!encounters || encounters.length < 3) return

  const allDone = encounters.every(
    e => ['caught', 'missed', 'active', 'boxed', 'dead', 'champion'].includes(e.status)
  )

  if (allDone) {
    await supabase
      .from('encounter_links')
      .update({ status: 'complete' })
      .eq('id', linkId)

    await supabase
      .from('run_locations')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('run_id', runId)
      .eq('location_id', locationId)
  }
}

async function logActivity(
  supabase: ReturnType<typeof createServerClient>,
  data: {
    run_id: string
    actor_id: string
    event_type: string
    entity_type?: string
    entity_id?: string
    message: string
    metadata?: Record<string, unknown>
  }
) {
  await supabase.from('activity_log').insert({
    run_id: data.run_id,
    actor_id: data.actor_id,
    event_type: data.event_type,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    message: data.message,
    metadata: data.metadata ?? null,
  })
}

export { logActivity }
