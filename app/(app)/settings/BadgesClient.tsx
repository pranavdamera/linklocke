'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { updateBadge } from '@/lib/actions/runs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Badge as BadgeType } from '@/lib/db/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export function BadgesClient({ badges, runId }: { badges: BadgeType[]; runId: string }) {
  const [pending, setPending] = useState<Set<number>>(new Set())
  const router = useRouter()

  async function toggle(badge: BadgeType) {
    if (pending.has(badge.badge_number)) return
    setPending(p => new Set(p).add(badge.badge_number))
    const result = await updateBadge(runId, badge.badge_number, !badge.obtained)
    setPending(p => { const n = new Set(p); n.delete(badge.badge_number); return n })
    if ('error' in result) {
      toast.error('Failed to update badge')
    } else {
      toast.success(!badge.obtained ? `${badge.name} obtained!` : `${badge.name} removed`)
      router.refresh()
    }
  }

  return (
    <Card className="bg-card/60">
      <CardContent className="p-4 space-y-2">
        {badges.map(badge => (
          <button
            key={badge.badge_number}
            onClick={() => toggle(badge)}
            disabled={pending.has(badge.badge_number)}
            className={cn(
              'w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left',
              badge.obtained
                ? 'bg-yellow-400/10 border-yellow-400/30 hover:bg-yellow-400/15'
                : 'bg-muted/20 border-border/30 hover:bg-muted/30'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-all',
              badge.obtained
                ? 'bg-yellow-400/30 border-yellow-400/60 text-yellow-300'
                : 'bg-muted/30 border-border/30 text-muted-foreground/40'
            )}>
              {badge.obtained ? <Check className="h-4 w-4" /> : badge.badge_number}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn('font-semibold text-sm', badge.obtained ? 'text-yellow-300' : 'text-muted-foreground')}>
                {badge.name}
              </div>
              <div className="text-xs text-muted-foreground">{badge.leader} · {badge.city}</div>
            </div>
            {badge.type_specialty && (
              <span className="text-xs text-muted-foreground/60 shrink-0">{badge.type_specialty}</span>
            )}
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
