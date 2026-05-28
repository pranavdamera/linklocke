import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PokemonCard } from '@/components/PokemonCard'
import { Badge } from '@/components/ui/badge'
import { cn, playerColorClass } from '@/lib/utils'
import type { Profile, PokemonEncounter, PlayerSlot } from '@/lib/db/types'
import { Shield } from 'lucide-react'

export default async function TeamPage() {
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

  const { data: run } = await supabase
    .from('runs')
    .select(`
      id,
      run_players(
        slot, game_version,
        profile:profiles(id, display_name, player_slot, theme_color, avatar_url)
      )
    `)
    .eq('id', runPlayer.run_id)
    .single()

  const players = (run?.run_players ?? []).map((rp: any) => rp.profile).filter(Boolean) as Profile[]

  const { data: encounters } = await supabase
    .from('pokemon_encounters')
    .select('*')
    .eq('run_id', runPlayer.run_id)
    .in('status', ['active', 'caught', 'boxed'])

  const byPlayer = new Map<string, PokemonEncounter[]>()
  for (const p of players) {
    const enc = (encounters ?? []).filter(e => e.player_id === p.id) as PokemonEncounter[]
    byPlayer.set(p.id, enc)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-400" /> Current Teams
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {players.map(player => {
          const slot = player.player_slot as PlayerSlot
          const enc = byPlayer.get(player.id) ?? []
          const active = enc.filter(e => e.status === 'active')
          const boxed = enc.filter(e => ['caught', 'boxed'].includes(e.status))

          return (
            <div key={player.id} className="space-y-3">
              {/* Player header */}
              <div className={cn(
                'rounded-xl border p-3 flex items-center justify-between',
                playerColorClass(slot)
              )}>
                <span className="font-bold">{player.display_name}</span>
                <Badge variant="outline" className={cn('text-xs', playerColorClass(slot))}>
                  {active.length}/6 active
                </Badge>
              </div>

              {/* Active team (up to 6 slots) */}
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => {
                  const e = active[i]
                  if (!e) {
                    return (
                      <div key={i} className="rounded-xl border border-dashed border-border/20 flex items-center justify-center h-24 text-muted-foreground/20 text-xs">
                        empty
                      </div>
                    )
                  }
                  return <PokemonCard key={e.id} encounter={e} player={player} compact />
                })}
              </div>

              {/* Boxed */}
              {boxed.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground uppercase font-medium">In Box ({boxed.length})</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {boxed.map(e => <PokemonCard key={e.id} encounter={e} player={player} compact />)}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
