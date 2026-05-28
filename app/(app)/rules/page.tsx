import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RulesClient } from './RulesClient'
import { BookOpen } from 'lucide-react'

export default async function RulesPage() {
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

  const { data: rules } = await supabase
    .from('rules')
    .select('*')
    .eq('run_id', runPlayer.run_id)
    .order('created_at')

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> Rules
      </h1>
      <RulesClient rules={rules ?? []} runId={runPlayer.run_id} />
    </div>
  )
}
