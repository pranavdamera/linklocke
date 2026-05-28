import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlayerCard } from '@/components/PlayerCard'
import { Card, CardContent } from '@/components/ui/card'
import type { Profile, PokemonEncounter } from '@/lib/db/types'

export default async function PlayersPage() {
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
      id, name,
      run_players(
        slot, game_version,
        profile:profiles(id, display_name, player_slot, theme_color, avatar_url)
      )
    `)
    .eq('id', runPlayer.run_id)
    .single()

  const players = (run?.run_players ?? []).map((rp: any) => ({ ...rp.profile, gameVersion: rp.game_version })).filter(Boolean)

  const { data: encounters } = await supabase
    .from('pokemon_encounters')
    .select('player_id, status, sprite_url, pokemon_name, nickname')
    .eq('run_id', runPlayer.run_id)

  const byPlayer = new Map<string, PokemonEncounter[]>()
  for (const p of players) {
    byPlayer.set(p.id, (encounters ?? []).filter(e => e.player_id === p.id) as any)
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Players</h1>
      <div className="grid gap-4">
        {players.map((player: Profile & { gameVersion: string }) => (
          <PlayerCard
            key={player.id}
            profile={player}
            encounters={byPlayer.get(player.id) ?? []}
            gameVersion={player.gameVersion}
          />
        ))}
      </div>
    </div>
  )
}
