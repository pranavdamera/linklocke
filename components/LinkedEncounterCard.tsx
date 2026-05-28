'use client'

import { cn, playerColorClass } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PokemonCard } from './PokemonCard'
import type { EncounterLinkWithEncounters, Profile, PlayerSlot } from '@/lib/db/types'
import { PLAYER_NAMES } from '@/lib/db/types'
import { Plus, Skull, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

interface LinkedEncounterCardProps {
  link: EncounterLinkWithEncounters
  players: Profile[]
  currentUserId?: string
  onAddEncounter?: (locationId: string, playerId: string) => void
  onMarkDead?: (encounterId: string, locationId: string) => void
  onEdit?: (encounterId: string) => void
  defaultExpanded?: boolean
}

const LINK_STATUS_COLOR: Record<string, string> = {
  open:     'border-border',
  complete: 'border-green-500/30',
  broken:   'border-yellow-500/30',
  dead:     'border-red-500/30',
}

export function LinkedEncounterCard({
  link,
  players,
  currentUserId,
  onAddEncounter,
  onMarkDead,
  onEdit,
  defaultExpanded = false,
}: LinkedEncounterCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const hasAnyEncounters = link.encounters.length > 0
  const allDead = link.encounters.length > 0 && link.encounters.every(e => e.status === 'dead')
  const hasDeath = link.encounters.some(e => e.status === 'dead')

  // Group encounters by player
  const byPlayer = new Map(link.encounters.map(e => [e.player_id, e]))

  return (
    <div className={cn(
      'rounded-xl border bg-card/60 overflow-hidden transition-all',
      LINK_STATUS_COLOR[link.status],
      allDead && 'opacity-70'
    )}>
      {/* Header - always visible, collapsible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{link.location.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <LocationTypeBadge type={link.location.location_type} />
              <LinkStatusBadge status={link.status} count={link.encounters.length} />
            </div>
          </div>
        </div>

        {/* Preview sprites (collapsed state) */}
        <div className="flex items-center gap-2 shrink-0">
          {!expanded && hasAnyEncounters && (
            <div className="flex -space-x-1">
              {players.map(p => {
                const enc = byPlayer.get(p.id)
                if (!enc?.sprite_url) return null
                return (
                  <div key={p.id} className="w-7 h-7 rounded-full border-2 border-background bg-muted/40 flex items-center justify-center overflow-hidden">
                    <Image src={enc.sprite_url} alt={enc.pokemon_name} width={24} height={24} unoptimized className="object-contain" />
                  </div>
                )
              })}
            </div>
          )}
          {hasDeath && <Skull className="h-4 w-4 text-red-400" />}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded encounter cards */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {players.map(player => {
              const enc = byPlayer.get(player.id)
              const isCurrentPlayer = player.id === currentUserId
              const slot = player.player_slot as PlayerSlot

              return (
                <div key={player.id} className="flex flex-col gap-2">
                  {/* Player label */}
                  <div className={cn('text-xs font-semibold text-center py-1 rounded-md bg-muted/30', playerColorClass(slot).split(' ').find(c => c.startsWith('text'))!)}>
                    {player.display_name}
                  </div>

                  {enc ? (
                    <PokemonCard
                      encounter={enc}
                      player={player}
                      compact
                      onMarkDead={
                        onMarkDead && !['dead', 'missed'].includes(enc.status)
                          ? () => onMarkDead(enc.id, link.location_id)
                          : undefined
                      }
                      onEdit={
                        onEdit && isCurrentPlayer
                          ? () => onEdit(enc.id)
                          : undefined
                      }
                    />
                  ) : (
                    <button
                      onClick={() => onAddEncounter?.(link.location_id, player.id)}
                      disabled={!onAddEncounter || !isCurrentPlayer}
                      className={cn(
                        'rounded-xl border border-dashed flex flex-col items-center justify-center gap-1 py-6 text-xs transition-colors',
                        isCurrentPlayer && onAddEncounter
                          ? 'border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-accent/20 cursor-pointer text-muted-foreground hover:text-foreground'
                          : 'border-muted/30 text-muted/40 cursor-default'
                      )}
                    >
                      {isCurrentPlayer ? (
                        <>
                          <Plus className="h-4 w-4" />
                          Add
                        </>
                      ) : (
                        <span className="text-[10px]">Not yet</span>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Death note */}
          {hasDeath && !allDead && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <Skull className="h-3 w-3" />
              Partial linked death — some Pokémon still alive
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LocationTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    route: 'bg-green-500/10 text-green-400',
    cave:  'bg-gray-500/10 text-gray-400',
    city:  'bg-blue-500/10 text-blue-400',
    forest:'bg-emerald-500/10 text-emerald-400',
    desert:'bg-yellow-500/10 text-yellow-400',
    tower: 'bg-purple-500/10 text-purple-400',
    bridge:'bg-cyan-500/10 text-cyan-400',
    water: 'bg-blue-400/10 text-blue-300',
    gift:  'bg-pink-500/10 text-pink-400',
    static:'bg-orange-500/10 text-orange-400',
  }
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded uppercase font-medium', colors[type] ?? 'bg-muted/30 text-muted-foreground')}>
      {type}
    </span>
  )
}

function LinkStatusBadge({ status, count }: { status: string; count: number }) {
  const config: Record<string, { label: string; cls: string }> = {
    open:     { label: `${count}/3`,     cls: 'text-muted-foreground' },
    complete: { label: 'Complete',        cls: 'text-green-400' },
    broken:   { label: 'Partial',         cls: 'text-yellow-400' },
    dead:     { label: 'All Dead',        cls: 'text-red-400' },
  }
  const c = config[status] ?? config.open
  return <span className={cn('text-[10px] font-medium', c.cls)}>{c.label}</span>
}
