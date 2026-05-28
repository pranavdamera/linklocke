'use client'

import Image from 'next/image'
import { cn, statusColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TYPE_COLORS } from '@/lib/db/types'
import type { PokemonEncounter, Profile, PlayerSlot } from '@/lib/db/types'
import { Skull, Star, Package, HelpCircle } from 'lucide-react'

interface PokemonCardProps {
  encounter: PokemonEncounter
  player: Profile
  compact?: boolean
  showActions?: boolean
  onMarkDead?: () => void
  onEdit?: () => void
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  dead:    <Skull className="w-3 h-3 text-red-400" />,
  boxed:   <Package className="w-3 h-3 text-gray-400" />,
  missed:  <HelpCircle className="w-3 h-3 text-yellow-400" />,
  champion: <Star className="w-3 h-3 text-yellow-300" />,
}

const SLOT_COLOR: Record<PlayerSlot, string> = {
  1: 'border-blue-500/30 shadow-blue-500/10',
  2: 'border-green-500/30 shadow-green-500/10',
  3: 'border-purple-500/30 shadow-purple-500/10',
}

export function PokemonCard({ encounter, player, compact = false, onMarkDead, onEdit }: PokemonCardProps) {
  const isDead = encounter.status === 'dead'
  const isMissed = encounter.status === 'missed'

  if (isMissed) {
    return (
      <div className={cn(
        'rounded-xl border bg-card/50 p-3 flex flex-col items-center gap-1 text-center',
        SLOT_COLOR[player.player_slot as PlayerSlot],
        compact ? 'p-2' : 'p-3'
      )}>
        <div className={cn('rounded-lg bg-yellow-500/10 flex items-center justify-center', compact ? 'w-12 h-12' : 'w-16 h-16')}>
          <HelpCircle className="text-yellow-400/60 w-6 h-6" />
        </div>
        <span className="badge-missed text-xs">Missed</span>
        {encounter.notes && <p className="text-xs text-muted-foreground line-clamp-1">{encounter.notes}</p>}
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-xl border bg-card/60 flex flex-col items-center gap-2 shadow-sm transition-all group relative',
      SLOT_COLOR[player.player_slot as PlayerSlot],
      isDead && 'opacity-60 grayscale',
      compact ? 'p-2' : 'p-3',
    )}>
      {/* Sprite */}
      <div className={cn(
        'relative flex items-center justify-center rounded-lg bg-muted/40',
        compact ? 'w-14 h-14' : 'w-20 h-20'
      )}>
        {encounter.sprite_url ? (
          <Image
            src={encounter.sprite_url}
            alt={encounter.pokemon_name}
            width={compact ? 48 : 64}
            height={compact ? 48 : 64}
            className={cn('object-contain', encounter.is_shiny && 'drop-shadow-[0_0_8px_#fde68a]')}
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-2xl">?</div>
        )}
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-950/40">
            <Skull className="text-red-400 w-6 h-6" />
          </div>
        )}
        {encounter.is_shiny && (
          <span className="absolute top-0.5 right-0.5 text-xs">✨</span>
        )}
      </div>

      {/* Name + Nickname */}
      <div className="text-center w-full min-w-0">
        {encounter.nickname && (
          <div className="font-semibold text-sm truncate">{encounter.nickname}</div>
        )}
        <div className={cn('text-muted-foreground truncate', encounter.nickname ? 'text-xs' : 'text-sm font-medium text-foreground')}>
          {encounter.pokemon_name}
        </div>
        {encounter.level_current && (
          <div className="text-xs text-muted-foreground">Lv.{encounter.level_current}</div>
        )}
      </div>

      {/* Types */}
      {encounter.types && encounter.types.length > 0 && (
        <div className="flex gap-1">
          {encounter.types.map(t => (
            <span
              key={t}
              className="type-chip text-white/80"
              style={{ backgroundColor: TYPE_COLORS[t] ? TYPE_COLORS[t] + 'cc' : '#666' }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-1">
        {STATUS_ICON[encounter.status]}
        <Badge variant={encounter.status as any} className="text-[10px] px-1.5 py-0">
          {encounter.status}
        </Badge>
      </div>

      {/* Gender / Nature */}
      {!compact && (encounter.gender || encounter.nature) && (
        <div className="text-xs text-muted-foreground flex gap-2">
          {encounter.gender && <span>{encounter.gender === 'male' ? '♂' : encounter.gender === 'female' ? '♀' : '⚪'}</span>}
          {encounter.nature && <span>{encounter.nature}</span>}
        </div>
      )}

      {/* Notes */}
      {!compact && encounter.notes && (
        <p className="text-xs text-muted-foreground text-center line-clamp-2 italic">{encounter.notes}</p>
      )}

      {/* Actions */}
      {(onMarkDead || onEdit) && !isDead && !isMissed && (
        <div className="flex gap-1 w-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 text-xs py-1 rounded-md bg-muted/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              Edit
            </button>
          )}
          {onMarkDead && (
            <button
              onClick={onMarkDead}
              className="flex-1 text-xs py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
            >
              💀 Dead
            </button>
          )}
        </div>
      )}
    </div>
  )
}
