import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlayerCard } from '@/components/PlayerCard'
import { StatsCards } from '@/components/StatsCards'
import { ActivityFeed } from '@/components/ActivityFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Award, MapPin, ArrowRight, Plus, Skull, Users } from 'lucide-react'
import { InviteCode } from './InviteCode'
import type { Profile, PokemonEncounter, PlayerSlot } from '@/lib/db/types'
import { UNOVA_BADGES } from '@/lib/pokemon/badges-bw'
import { CreateRunForm } from './CreateRunForm'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get active run (first run this user is a member of)
  const { data: runPlayerData } = await supabase
    .from('run_players')
    .select(`
      run_id,
      run:runs(
        id, name, game, status, badge_count, created_at, updated_at,
        run_players(
          id, slot, player_name, game_version,
          profile:profiles(id, display_name, player_slot, theme_color, avatar_url)
        )
      )
    `)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  const run = runPlayerData?.run as any

  // If no run, show create form
  if (!run || !run.id) {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚔️</div>
          <h1 className="text-2xl font-bold mb-2">No active run</h1>
          <p className="text-muted-foreground text-sm">Create a new Linklocke run to get started.</p>
        </div>
        <CreateRunForm userId={user.id} profile={profile} />
      </div>
    )
  }

  // Get all encounters for this run
  const { data: encounters } = await supabase
    .from('pokemon_encounters')
    .select('*, player:profiles(id, display_name, player_slot)')
    .eq('run_id', run.id)

  // Get run_locations for progress
  const { data: runLocations } = await supabase
    .from('run_locations')
    .select('status')
    .eq('run_id', run.id)

  // Get badges
  const { data: badges } = await supabase
    .from('badges')
    .select('*')
    .eq('run_id', run.id)
    .order('badge_number')

  // Get recent activity
  const { data: activity } = await supabase
    .from('activity_log')
    .select('*, actor:profiles(id, display_name, player_slot)')
    .eq('run_id', run.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Build per-player encounter map
  const players = run.run_players?.map((rp: any) => rp.profile).filter(Boolean) as Profile[]
  const encountersByPlayer = new Map<string, PokemonEncounter[]>()
  for (const p of players) {
    encountersByPlayer.set(p.id, (encounters ?? []).filter((e: any) => e.player_id === p.id))
  }

  // Stats
  const allEncounters = encounters ?? []
  const stats = {
    totalEncounters: allEncounters.filter(e => e.status !== 'missed').length,
    totalAlive: allEncounters.filter(e => ['active', 'caught', 'boxed'].includes(e.status)).length,
    totalDead: allEncounters.filter(e => e.status === 'dead').length,
    totalBoxed: allEncounters.filter(e => e.status === 'boxed').length,
    totalMissed: allEncounters.filter(e => e.status === 'missed').length,
    totalChampion: allEncounters.filter(e => e.status === 'champion').length,
    badgeCount: run.badge_count ?? 0,
    routesComplete: (runLocations ?? []).filter(l => l.status === 'completed').length,
    routesTotal: (runLocations ?? []).length,
    byPlayer: players.map(p => ({
      name: p.display_name,
      slot: p.player_slot as 1 | 2 | 3,
      alive: (encountersByPlayer.get(p.id) ?? []).filter(e => ['active', 'caught', 'boxed'].includes(e.status)).length,
      dead:  (encountersByPlayer.get(p.id) ?? []).filter(e => e.status === 'dead').length,
    })),
  }

  const obtainedBadges = (badges ?? []).filter(b => b.obtained)
  const nextBadge = (badges ?? []).find(b => !b.obtained)
  const routePercent = stats.routesTotal ? Math.round((stats.routesComplete / stats.routesTotal) * 100) : 0

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Run header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{run.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={run.status === 'active' ? 'alive' : 'boxed'} className="capitalize">{run.status}</Badge>
            <span className="text-sm text-muted-foreground">Pokémon {run.game.replace('pokemon_', '').replace(/_/g, ' ')}</span>
            <span className="text-sm text-muted-foreground">{players.length}/3 players</span>
          </div>
        </div>
        <Link href="/routes">
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-1" /> Routes
          </Button>
        </Link>
      </div>

      {/* Invite code — shown when run isn't full */}
      {players.length < 3 && (
        <InviteCode runId={run.id} runName={run.name} />
      )}

      {/* Badge bar */}
      <Card className="bg-card/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Award className="h-4 w-4 text-yellow-400" />
              Badges — {obtainedBadges.length}/8
            </div>
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground">Manage</Link>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(badges ?? []).map(badge => (
              <div
                key={badge.badge_number}
                title={`${badge.name} — ${badge.leader} (${badge.city})`}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  badge.obtained
                    ? 'bg-yellow-400/20 border-yellow-400/60 text-yellow-300'
                    : 'bg-muted/30 border-border/30 text-muted-foreground/30'
                }`}
              >
                {badge.badge_number}
              </div>
            ))}
          </div>
          {nextBadge && (
            <p className="text-xs text-muted-foreground mt-2">
              Next: <strong className="text-foreground">{nextBadge.name}</strong> ({nextBadge.leader}, {nextBadge.city})
            </p>
          )}
        </CardContent>
      </Card>

      {/* Route progress */}
      <Card className="bg-card/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-400" />
              Route Progress
            </div>
            <span className="text-sm font-bold text-green-400">{routePercent}%</span>
          </div>
          <Progress value={routePercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">{stats.routesComplete} of {stats.routesTotal} locations completed</p>
        </CardContent>
      </Card>

      {/* Player cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Players</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {players.map(player => (
            <PlayerCard
              key={player.id}
              profile={player}
              encounters={encountersByPlayer.get(player.id) ?? []}
              gameVersion={run.run_players?.find((rp: any) => rp.profile?.id === player.id)?.game_version}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Run Stats</h2>
        <StatsCards stats={stats} />
      </div>

      {/* Recent activity */}
      <Card className="bg-card/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href="/activity">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ActivityFeed events={activity ?? []} limit={8} />
        </CardContent>
      </Card>
    </div>
  )
}
