import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PokemonCard } from '@/components/PokemonCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, playerColorClass } from '@/lib/utils'
import type { Profile, PokemonEncounter, PlayerSlot } from '@/lib/db/types'
import { Shield, Skull, Package, HelpCircle, Trophy } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function PlayerProfilePage({ params }: { params: { playerId: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.playerId)
    .single()

  if (!profile) notFound()

  // Get run
  const { data: runPlayer } = await supabase
    .from('run_players')
    .select('run_id, game_version')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!runPlayer) return <div className="p-8 text-muted-foreground">No active run.</div>

  const { data: encounters } = await supabase
    .from('pokemon_encounters')
    .select(`
      *, location:locations(id, name, slug)
    `)
    .eq('run_id', runPlayer.run_id)
    .eq('player_id', params.playerId)
    .order('caught_at', { ascending: false })

  const allEncounters = (encounters ?? []) as (PokemonEncounter & { location: { id: string; name: string; slug: string } | null })[]

  const team    = allEncounters.filter(e => e.status === 'active')
  const boxed   = allEncounters.filter(e => ['caught', 'boxed'].includes(e.status))
  const dead    = allEncounters.filter(e => e.status === 'dead')
  const missed  = allEncounters.filter(e => e.status === 'missed')
  const champs  = allEncounters.filter(e => e.status === 'champion')

  const slot = profile.player_slot as PlayerSlot

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <Link href="/players" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ChevronLeft className="h-4 w-4" /> Players
      </Link>

      {/* Profile header */}
      <div className={cn('rounded-2xl border p-6 bg-gradient-to-br',
        slot === 1 ? 'from-blue-500/15 to-transparent border-blue-500/20' :
        slot === 2 ? 'from-green-500/15 to-transparent border-green-500/20' :
                    'from-purple-500/15 to-transparent border-purple-500/20'
      )}>
        <div className="flex items-center gap-4">
          <Avatar className={cn('w-16 h-16 text-xl font-bold border-2', playerColorClass(slot).split(' ').filter(c => c.startsWith('border')).join(' '))}>
            <AvatarFallback className={cn(playerColorClass(slot).split(' ').find(c => c.startsWith('text')))}>
              {profile.display_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className={cn('text-2xl font-bold', playerColorClass(slot).split(' ').find(c => c.startsWith('text'))!)}>
              {profile.display_name}
            </h1>
            <div className="text-sm text-muted-foreground">Player {slot} · Pokémon {runPlayer.game_version}</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {[
            { icon: <Shield className="h-4 w-4 text-blue-400" />,   label: 'Active', value: team.length,   color: 'text-blue-400' },
            { icon: <Package className="h-4 w-4 text-gray-400" />,  label: 'Boxed',  value: boxed.length,  color: 'text-gray-400' },
            { icon: <Skull className="h-4 w-4 text-red-400" />,     label: 'Dead',   value: dead.length,   color: 'text-red-400' },
            { icon: <HelpCircle className="h-4 w-4 text-yellow-400" />, label: 'Missed', value: missed.length, color: 'text-yellow-400' },
            { icon: <Trophy className="h-4 w-4 text-yellow-300" />, label: 'Champ',  value: champs.length, color: 'text-yellow-300' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1 bg-black/20 rounded-lg py-2">
              {s.icon}
              <span className={cn('text-lg font-bold leading-none', s.color)}>{s.value}</span>
              <span className="text-[9px] text-muted-foreground uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="team">
        <TabsList className="w-full">
          <TabsTrigger value="team" className="flex-1">Active ({team.length})</TabsTrigger>
          <TabsTrigger value="boxed" className="flex-1">Boxed ({boxed.length})</TabsTrigger>
          <TabsTrigger value="dead" className="flex-1">Dead ({dead.length})</TabsTrigger>
          <TabsTrigger value="missed" className="flex-1">Missed ({missed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          {team.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No active Pokémon.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {team.map(enc => <PokemonCard key={enc.id} encounter={enc} player={profile} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="boxed" className="mt-4">
          {boxed.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Nothing in the box.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {boxed.map(enc => <PokemonCard key={enc.id} encounter={enc} player={profile} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dead" className="mt-4">
          {dead.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No deaths yet. Stay safe.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dead.map(enc => (
                <div key={enc.id}>
                  <PokemonCard encounter={enc} player={profile} />
                  {enc.location && (
                    <p className="text-xs text-muted-foreground text-center mt-1">{enc.location.name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="missed" className="mt-4">
          {missed.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No missed encounters.</p>
          ) : (
            <div className="space-y-2">
              {missed.map(enc => (
                <div key={enc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <HelpCircle className="h-4 w-4 text-yellow-400 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{enc.location?.name ?? 'Unknown location'}</div>
                    {enc.notes && <div className="text-xs text-muted-foreground">{enc.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
