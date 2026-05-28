import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActivityFeed } from '@/components/ActivityFeed'
import { Card, CardContent } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export default async function ActivityPage() {
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

  const { data: events } = await supabase
    .from('activity_log')
    .select('*, actor:profiles(id, display_name, player_slot)')
    .eq('run_id', runPlayer.run_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" /> Activity Log
      </h1>

      <Card className="bg-card/60">
        <CardContent className="p-4">
          <ActivityFeed events={(events ?? []) as any} limit={100} />
        </CardContent>
      </Card>
    </div>
  )
}
