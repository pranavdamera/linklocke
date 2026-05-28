import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { RouteDetailClient } from './RouteDetailClient'
import type { Profile, PokemonEncounter, EncounterLink, Location } from '@/lib/db/types'

export default async function RouteDetailPage({ params }: { params: { locationId: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { locationId } = params

  // Get location
  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single()

  if (!location) notFound()

  // Get run
  const { data: runPlayer } = await supabase
    .from('run_players')
    .select(`
      run_id, slot, game_version,
      run:runs(
        id, name, status,
        run_players(
          id, slot, game_version,
          profile:profiles(id, display_name, player_slot, theme_color, avatar_url)
        )
      )
    `)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!runPlayer?.run_id) {
    redirect('/dashboard')
  }

  const run = runPlayer.run as any
  const runId = runPlayer.run_id

  // Get players
  const players = run.run_players?.map((rp: any) => rp.profile).filter(Boolean) as Profile[]

  // Get encounter link for this location
  const { data: link } = await supabase
    .from('encounter_links')
    .select('*')
    .eq('run_id', runId)
    .eq('location_id', locationId)
    .single()

  // Get encounters for this location
  const { data: encounters } = await supabase
    .from('pokemon_encounters')
    .select(`
      *,
      player:profiles(id, display_name, player_slot, theme_color, avatar_url)
    `)
    .eq('run_id', runId)
    .eq('location_id', locationId)

  // Get death events for this location
  const { data: deathEvents } = await supabase
    .from('death_events')
    .select('*, trigger_player:profiles(display_name)')
    .eq('run_id', runId)
    .eq('location_id', locationId)
    .eq('is_undone', false)

  // Get run_location status
  const { data: runLocation } = await supabase
    .from('run_locations')
    .select('status')
    .eq('run_id', runId)
    .eq('location_id', locationId)
    .single()

  return (
    <RouteDetailClient
      location={location}
      players={players}
      currentUserId={user.id}
      runId={runId}
      encounters={(encounters ?? []) as any}
      link={link ?? null}
      deathEvents={deathEvents ?? []}
      routeStatus={runLocation?.status ?? 'available'}
    />
  )
}
