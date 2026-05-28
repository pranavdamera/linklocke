'use server'

import { createServerClient } from '@/lib/supabase/server'
import { CreateRunSchema } from '@/lib/validation/run'
import type { CreateRunInput } from '@/lib/validation/run'
import { UNOVA_BADGES } from '@/lib/pokemon/badges-bw'
import { getDefaultRules } from '@/lib/pokemon/rules'
import { revalidatePath } from 'next/cache'

export async function createRun(input: CreateRunInput) {
  const parsed = CreateRunSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _root: ['Not authenticated'] } }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: { _root: ['Profile not found'] } }

  const data = parsed.data

  const { data: run, error: runError } = await supabase
    .from('runs')
    .insert({ name: data.name, game: data.game, region: data.region, created_by: user.id })
    .select('id')
    .single()

  if (runError || !run) return { error: { _root: [runError?.message ?? 'Failed to create run'] } }

  for (const player of data.players) {
    await supabase.from('run_players').insert({
      run_id: run.id,
      profile_id: player.profile_id,
      player_name: player.player_name,
      slot: player.slot,
      game_version: player.game_version,
    })
  }

  for (const badge of UNOVA_BADGES) {
    await supabase.from('badges').insert({
      run_id: run.id,
      badge_number: badge.number,
      name: badge.name,
      leader: badge.leader,
      city: badge.city,
      type_specialty: badge.type,
    })
  }

  const rules = getDefaultRules()
  for (const rule of rules) {
    await supabase.from('rules').insert({ run_id: run.id, ...rule })
  }

  const { data: locations } = await supabase
    .from('locations')
    .select('id, order_index, badge_gate')
    .eq('game', 'pokemon_black_white')
    .order('order_index')

  if (locations) {
    for (const loc of locations) {
      const status = (!loc.badge_gate || loc.badge_gate <= 0) ? 'available' : 'locked'
      await supabase.from('run_locations').insert({
        run_id: run.id,
        location_id: loc.id,
        status,
      })
    }
  }

  await supabase.from('activity_log').insert({
    run_id: run.id,
    actor_id: user.id,
    event_type: 'run_created',
    message: `Run "${data.name}" created`,
    metadata: { players: data.players.map(p => p.player_name) },
  })

  revalidatePath('/dashboard')
  return { success: true, run_id: run.id }
}

export async function joinRun(runId: string): Promise<{ success: true; run_name: string } | { error: string }> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, player_slot')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Set up your profile in Settings before joining a run.' }

  const { data: run } = await supabase
    .from('runs')
    .select('id, name, status')
    .eq('id', runId.trim())
    .single()

  if (!run) return { error: 'Run not found. Double-check the code and try again.' }
  if (run.status !== 'active') return { error: 'This run is no longer active.' }

  // Already a member?
  const { data: alreadyIn } = await supabase
    .from('run_players')
    .select('id')
    .eq('run_id', runId)
    .eq('profile_id', user.id)
    .single()

  if (alreadyIn) return { error: "You're already in this run." }

  // Slot taken by someone else?
  const { data: slotTaken } = await supabase
    .from('run_players')
    .select('id, profile_id')
    .eq('run_id', runId)
    .eq('slot', profile.player_slot)
    .single()

  if (slotTaken) {
    return { error: `Slot ${profile.player_slot} is already taken. Go to Settings and pick a different slot first.` }
  }

  await supabase.from('run_players').insert({
    run_id: runId,
    profile_id: user.id,
    player_name: profile.display_name,
    slot: profile.player_slot,
    game_version: 'Black',
  })

  await supabase.from('activity_log').insert({
    run_id: runId,
    actor_id: user.id,
    event_type: 'run_created',
    message: `${profile.display_name} joined the run`,
    metadata: { slot: profile.player_slot },
  })

  revalidatePath('/dashboard')
  return { success: true, run_name: run.name }
}

export async function getActiveRun() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('run_players')
    .select(`
      run:runs(
        id, name, game, region, status, badge_count, created_at,
        run_players(
          id, slot, player_name, game_version, profile_id,
          profile:profiles(id, display_name, player_slot, theme_color, avatar_url)
        )
      )
    `)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data?.run ?? null
}

export async function updateBadge(runId: string, badgeNumber: number, obtained: boolean) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('badges')
    .update({
      obtained,
      obtained_at: obtained ? new Date().toISOString() : null,
    })
    .eq('run_id', runId)
    .eq('badge_number', badgeNumber)

  if (error) return { error: error.message }

  const { data: badges } = await supabase
    .from('badges')
    .select('obtained')
    .eq('run_id', runId)

  const count = badges?.filter(b => b.obtained).length ?? 0
  await supabase.from('runs').update({ badge_count: count }).eq('id', runId)

  await supabase.from('activity_log').insert({
    run_id: runId,
    actor_id: user.id,
    event_type: 'badge_update',
    message: obtained ? `Badge ${badgeNumber} obtained!` : `Badge ${badgeNumber} removed`,
    metadata: { badge_number: badgeNumber, obtained },
  })

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  return { success: true }
}

export async function toggleRule(runId: string, key: string, enabled: boolean) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('rules')
    .update({ enabled })
    .eq('run_id', runId)
    .eq('key', key)

  if (error) return { error: error.message }

  await supabase.from('activity_log').insert({
    run_id: runId,
    actor_id: user.id,
    event_type: 'rule_toggled',
    message: `Rule "${key}" ${enabled ? 'enabled' : 'disabled'}`,
    metadata: { key, enabled },
  })

  revalidatePath('/rules')
  revalidatePath('/settings')
  return { success: true }
}
