import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skull, Link2, RotateCcw } from 'lucide-react'
import { formatDateTime, timeAgo } from '@/lib/utils'
import { UndoDeathButton } from './UndoDeathButton'
import type { Profile, PlayerSlot } from '@/lib/db/types'

// Slot labels are resolved from profile.display_name at runtime
const SLOT_COLOR: Record<PlayerSlot, string> = {
  1: 'text-blue-400', 2: 'text-green-400', 3: 'text-purple-400',
}

export default async function GraveyardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: runPlayer } = await supabase
    .from('run_players')
    .select('run_id')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!runPlayer) {
    return <div className="p-8 text-center text-muted-foreground">No active run.</div>
  }

  const runId = runPlayer.run_id

  // Get all death events with full encounter info
  const { data: deathEvents } = await supabase
    .from('death_events')
    .select(`
      id, cause, opponent, death_location, notes, created_at, is_undone,
      trigger_player:profiles(id, display_name, player_slot),
      location:locations(id, name),
      trigger_encounter:pokemon_encounters(
        id, pokemon_name, nickname, sprite_url, types,
        player:profiles(id, display_name, player_slot)
      )
    `)
    .eq('run_id', runId)
    .order('created_at', { ascending: false })

  // Get all dead encounters grouped by death_event_id
  const { data: deadEncounters } = await supabase
    .from('pokemon_encounters')
    .select('*, player:profiles(id, display_name, player_slot)')
    .eq('run_id', runId)
    .eq('status', 'dead')

  const byDeathEvent = new Map<string, typeof deadEncounters>()
  for (const enc of deadEncounters ?? []) {
    if (!enc.death_event_id) continue
    const arr = byDeathEvent.get(enc.death_event_id) ?? []
    arr.push(enc)
    byDeathEvent.set(enc.death_event_id, arr)
  }

  const totalDeaths = (deadEncounters ?? []).length

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Skull className="h-5 w-5 text-red-400" /> Graveyard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalDeaths} souls lost</p>
        </div>
      </div>

      {(deathEvents ?? []).length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">🪦</div>
          <p className="text-muted-foreground">No deaths yet. Keep it that way.</p>
        </div>
      )}

      <div className="space-y-4">
        {(deathEvents ?? []).map(event => {
          const casualties = byDeathEvent.get(event.id) ?? []
          const isLinked = casualties.length > 1
          const te = Array.isArray(event.trigger_encounter) ? event.trigger_encounter[0] : event.trigger_encounter
          const loc = Array.isArray(event.location) ? event.location[0] : event.location
          const tp = Array.isArray(event.trigger_player) ? event.trigger_player[0] : event.trigger_player

          return (
            <Card key={event.id} className={`bg-card/60 border ${event.is_undone ? 'opacity-40 border-border/20' : 'border-red-500/20'}`}>
              <CardContent className="p-4 space-y-3">
                {/* Event header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isLinked && <Link2 className="h-4 w-4 text-orange-400 shrink-0" />}
                    <Skull className="h-4 w-4 text-red-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm text-red-300">
                        {isLinked ? 'Linked Death Event' : 'Death'}
                        {event.is_undone && <span className="ml-2 text-xs text-muted-foreground">(undone)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {loc?.name && `${loc.name} · `}
                        {formatDateTime(event.created_at)}
                      </div>
                    </div>
                  </div>
                  {!event.is_undone && (
                    <UndoDeathButton deathEventId={event.id} runId={runId} />
                  )}
                </div>

                {/* Cause info */}
                {(event.cause || event.opponent || event.death_location) && (
                  <div className="text-xs text-muted-foreground space-y-0.5 pl-2 border-l border-border/30">
                    {event.cause && <div>Cause: <span className="text-foreground">{event.cause}</span></div>}
                    {event.opponent && <div>Opponent: <span className="text-foreground">{event.opponent}</span></div>}
                    {event.death_location && <div>Where: <span className="text-foreground">{event.death_location}</span></div>}
                    {event.notes && <div className="italic">{event.notes}</div>}
                  </div>
                )}

                {/* Casualties */}
                <div className="flex flex-wrap gap-2">
                  {casualties.map((enc: any) => {
                    const player = Array.isArray(enc.player) ? enc.player[0] : enc.player
                    const slot = player?.player_slot as PlayerSlot
                    return (
                      <div key={enc.id} className="flex items-center gap-2 bg-red-500/10 border border-red-500/15 rounded-lg px-2.5 py-1.5">
                        {enc.sprite_url ? (
                          <Image src={enc.sprite_url} alt={enc.pokemon_name} width={32} height={32} unoptimized className="object-contain grayscale" />
                        ) : (
                          <Skull className="h-4 w-4 text-red-400/60" />
                        )}
                        <div>
                          <div className="text-sm font-medium leading-none">{enc.nickname ?? enc.pokemon_name}</div>
                          <div className={`text-xs mt-0.5 ${slot ? SLOT_COLOR[slot] : 'text-muted-foreground'}`}>
                            {player?.display_name ?? 'Unknown'}
                            {enc.id === te?.id && isLinked && (
                              <span className="ml-1 text-orange-400">(trigger)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
