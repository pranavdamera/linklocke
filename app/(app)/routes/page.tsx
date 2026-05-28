import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { CheckCircle2, Circle, Lock, MapPin, Skull, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Location } from '@/lib/db/types'

type RunLocationRow = {
  id: string
  status: string
  completed_at: string | null
  location_id: string
  location: Location | Location[] | null
}

export default async function RoutesPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get active run
  const { data: runPlayer } = await supabase
    .from('run_players')
    .select('run_id')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!runPlayer) {
    return <div className="p-8 text-center text-muted-foreground">No active run found. <Link href="/dashboard" className="text-primary underline">Create one</Link></div>
  }

  const runId = runPlayer.run_id

  // Get all locations with their run status
  const { data: runLocations } = await supabase
    .from('run_locations')
    .select(`
      id, status, completed_at, location_id,
      location:locations(id, name, slug, location_type, order_index, badge_gate, is_optional, is_encounter_area)
    `)
    .eq('run_id', runId)
    .order('location(order_index)')

  // Get encounter links with encounter count per location
  const { data: links } = await supabase
    .from('encounter_links')
    .select('id, location_id, status')
    .eq('run_id', runId)

  const linksByLocation = new Map(links?.map(l => [l.location_id, l]) ?? [])

  // Get death events count per location
  const { data: deaths } = await supabase
    .from('death_events')
    .select('location_id')
    .eq('run_id', runId)
    .eq('is_undone', false)

  const deathsByLocation = new Set(deaths?.map(d => d.location_id) ?? [])

  // Normalize: Supabase returns nested joins as arrays
  const locations: RunLocationRow[] = (runLocations ?? []).map((l: any) => ({
    ...l,
    location: Array.isArray(l.location) ? l.location[0] ?? null : l.location,
  }))

  const completed = locations.filter(l => l.status === 'completed').length
  const total = locations.filter(l => (l.location as Location | null)?.is_encounter_area).length
  const pct = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Route Tracker</h1>
          <p className="text-sm text-muted-foreground">Unova Black & White</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-green-400">{pct}%</div>
          <div className="text-xs text-muted-foreground">{completed}/{total} done</div>
        </div>
      </div>

      <Progress value={pct} className="h-1.5" />

      {/* Location list */}
      <div className="space-y-1.5">
        {locations.map(({ id, status, location: locRaw }) => {
          const loc = locRaw as Location | null
          if (!loc) return null
          const link = linksByLocation.get(loc.id)
          const hasDeath = deathsByLocation.has(loc.id)
          const isDone = status === 'completed'
          const isLocked = status === 'locked'
          const encounterCount = 0 // simplified

          return (
            <Link
              key={id}
              href={`/routes/${loc.id}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group',
                isDone   ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' :
                isLocked ? 'bg-muted/10 border-border/20 opacity-50 pointer-events-none' :
                           'bg-card/60 border-border/30 hover:bg-card/80 hover:border-border/50'
              )}
            >
              {/* Status icon */}
              <div className="shrink-0 w-5 flex justify-center">
                {isDone   ? <CheckCircle2 className="h-4 w-4 text-green-400" /> :
                 isLocked ? <Lock className="h-4 w-4 text-muted-foreground/40" /> :
                            <Circle className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground" />}
              </div>

              {/* Location info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium truncate', isDone && 'text-green-300', isLocked && 'text-muted-foreground/40')}>
                    {loc.name}
                  </span>
                  {loc.is_optional && <span className="text-[10px] text-muted-foreground/50 shrink-0">optional</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <LocationTypePill type={loc.location_type} />
                  {loc.badge_gate && (
                    <span className="text-[10px] text-muted-foreground/50">Badge {loc.badge_gate}+</span>
                  )}
                  {link && (
                    <span className="text-[10px] text-muted-foreground/50">
                      {link.status === 'dead' ? '☠ dead' : link.status === 'complete' ? '✓ complete' : `link: ${link.status}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Right icons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {hasDeath && <Skull className="h-3.5 w-3.5 text-red-400" />}
                {!loc.is_encounter_area && <span className="text-[10px] text-muted-foreground/40">no enc.</span>}
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No locations found. Make sure the seed data was applied.
        </div>
      )}
    </div>
  )
}

function LocationTypePill({ type }: { type: string }) {
  const cfg: Record<string, string> = {
    route:    'bg-green-500/10 text-green-400',
    cave:     'bg-gray-500/10 text-gray-400',
    city:     'bg-blue-500/10 text-blue-400',
    forest:   'bg-emerald-500/10 text-emerald-400',
    desert:   'bg-yellow-500/10 text-yellow-400',
    tower:    'bg-purple-500/10 text-purple-400',
    bridge:   'bg-cyan-500/10 text-cyan-400',
    water:    'bg-blue-400/10 text-blue-300',
    gift:     'bg-pink-500/10 text-pink-400',
    static:   'bg-orange-500/10 text-orange-400',
    building: 'bg-slate-500/10 text-slate-400',
  }
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded uppercase font-medium', cfg[type] ?? 'bg-muted/30 text-muted-foreground')}>
      {type}
    </span>
  )
}
