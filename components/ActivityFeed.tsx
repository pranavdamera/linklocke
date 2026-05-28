import { timeAgo } from '@/lib/utils'
import type { ActivityLog, Profile } from '@/lib/db/types'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Edit2, AlertTriangle, Skull, Link2, RotateCcw,
  Award, Settings, MapPin, Zap, Play
} from 'lucide-react'

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  encounter_added:   { icon: <Plus className="h-3.5 w-3.5" />,        color: 'text-blue-400',   label: 'Caught' },
  encounter_updated: { icon: <Edit2 className="h-3.5 w-3.5" />,       color: 'text-cyan-400',   label: 'Updated' },
  encounter_missed:  { icon: <AlertTriangle className="h-3.5 w-3.5" />,color: 'text-yellow-400', label: 'Missed' },
  pokemon_died:      { icon: <Skull className="h-3.5 w-3.5" />,        color: 'text-red-400',    label: 'Death' },
  linked_death:      { icon: <Link2 className="h-3.5 w-3.5" />,        color: 'text-orange-400', label: 'Linked ☠' },
  revived:           { icon: <Zap className="h-3.5 w-3.5" />,          color: 'text-green-400',  label: 'Revived' },
  undone:            { icon: <RotateCcw className="h-3.5 w-3.5" />,    color: 'text-purple-400', label: 'Undone' },
  badge_update:      { icon: <Award className="h-3.5 w-3.5" />,        color: 'text-yellow-300', label: 'Badge' },
  settings_update:   { icon: <Settings className="h-3.5 w-3.5" />,     color: 'text-gray-400',   label: 'Settings' },
  location_complete: { icon: <MapPin className="h-3.5 w-3.5" />,       color: 'text-green-400',  label: 'Route Done' },
  run_created:       { icon: <Play className="h-3.5 w-3.5" />,         color: 'text-primary',    label: 'Run Start' },
  rule_toggled:      { icon: <Settings className="h-3.5 w-3.5" />,     color: 'text-gray-400',   label: 'Rule' },
}

interface ActivityFeedProps {
  events: (ActivityLog & { actor?: Profile | null })[]
  limit?: number
}

export function ActivityFeed({ events, limit = 20 }: ActivityFeedProps) {
  const shown = events.slice(0, limit)

  if (!shown.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No activity yet.</p>
  }

  return (
    <div className="space-y-1">
      {shown.map(event => {
        const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.settings_update
        return (
          <div key={event.id} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
            <div className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm leading-snug">{event.message}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {event.actor && (
                  <span className="text-xs text-muted-foreground font-medium">{event.actor.display_name}</span>
                )}
                <span className="text-xs text-muted-foreground/60">{timeAgo(event.created_at)}</span>
              </div>
            </div>
            <span className={`text-[10px] shrink-0 font-medium mt-0.5 ${config.color}`}>{config.label}</span>
          </div>
        )
      })}
    </div>
  )
}
