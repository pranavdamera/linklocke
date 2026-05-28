import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BadgesClient } from './BadgesClient'
import { ProfileSetup } from './ProfileSetup'
import { Settings, Award, User, Users } from 'lucide-react'
import type { Profile, PlayerSlot } from '@/lib/db/types'
import { cn, playerColorClass } from '@/lib/utils'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: runPlayer } = await supabase
    .from('run_players')
    .select('run_id, game_version')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  const run = runPlayer ? await supabase
    .from('runs')
    .select(`
      id, name, status,
      run_players(
        slot, game_version,
        profile:profiles(id, display_name, player_slot, theme_color)
      )
    `)
    .eq('id', runPlayer.run_id)
    .single() : null

  const { data: badges } = runPlayer ? await supabase
    .from('badges')
    .select('*')
    .eq('run_id', runPlayer.run_id)
    .order('badge_number') : { data: null }

  const players = (run?.data?.run_players ?? []).map((rp: any) => rp.profile).filter(Boolean) as Profile[]

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Settings className="h-5 w-5" /> Settings
      </h1>

      {/* Profile */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <User className="h-4 w-4" /> Your Profile
        </h2>
        <ProfileSetup profile={profile} userId={user.id} />
      </section>

      {/* Players in run */}
      {players.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4" /> Players in Run
          </h2>
          <Card className="bg-card/60">
            <CardContent className="p-4 space-y-3">
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm', playerColorClass(p.player_slot as PlayerSlot))}>
                    {p.display_name[0]}
                  </div>
                  <div>
                    <div className={cn('font-medium text-sm', playerColorClass(p.player_slot as PlayerSlot).split(' ').find(c => c.startsWith('text'))!)}>
                      {p.display_name}
                    </div>
                    <div className="text-xs text-muted-foreground">Slot {p.player_slot}</div>
                  </div>
                  <Link href={`/players/${p.id}`} className="ml-auto text-xs text-primary hover:underline">View</Link>
                </div>
              ))}
              <Separator />
              <p className="text-xs text-muted-foreground">
                To add players to the run, ask them to sign up and then manually run the SQL to join them to the run_players table.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Badges */}
      {badges && runPlayer && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Award className="h-4 w-4" /> Gym Badges
          </h2>
          <BadgesClient badges={badges} runId={runPlayer.run_id} />
        </section>
      )}
    </div>
  )
}
