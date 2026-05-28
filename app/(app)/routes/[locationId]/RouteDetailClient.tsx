'use client'

import { useState } from 'react'
import { PokemonCard } from '@/components/PokemonCard'
import { AddEncounterModal } from '@/components/AddEncounterModal'
import { DeathConfirmModal } from '@/components/DeathConfirmModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn, playerColorClass } from '@/lib/utils'
import type { Location, Profile, PokemonEncounter, EncounterLink, PlayerSlot } from '@/lib/db/types'
import { Plus, Skull, ChevronLeft, MapPin, Swords } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RouteDetailClientProps {
  location: Location
  players: Profile[]
  currentUserId: string
  runId: string
  encounters: (PokemonEncounter & { player: Profile })[]
  link: EncounterLink | null
  deathEvents: any[]
  routeStatus: string
}

export function RouteDetailClient({
  location, players, currentUserId, runId,
  encounters, link, deathEvents, routeStatus,
}: RouteDetailClientProps) {
  const router = useRouter()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addForPlayerId, setAddForPlayerId] = useState('')
  const [deathModalOpen, setDeathModalOpen] = useState(false)
  const [deathTarget, setDeathTarget] = useState<{ encounter: PokemonEncounter; player: Profile } | null>(null)

  const byPlayer = new Map(encounters.map(e => [e.player_id, e]))
  const currentPlayer = players.find(p => p.id === currentUserId)
  const myEncounter = byPlayer.get(currentUserId)

  function openAddModal(playerId: string) {
    setAddForPlayerId(playerId)
    setAddModalOpen(true)
  }

  function openDeathModal(enc: PokemonEncounter & { player: Profile }) {
    setDeathTarget({ encounter: enc, player: enc.player })
    setDeathModalOpen(true)
  }

  const linkedEncounters = encounters.filter(e => e.id !== deathTarget?.encounter.id && !['dead', 'missed'].includes(e.status))

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Back nav */}
      <Link href="/routes" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ChevronLeft className="h-4 w-4" /> Back to routes
      </Link>

      {/* Location header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase font-medium">{location.location_type}</span>
          </div>
          <h1 className="text-2xl font-bold">{location.name}</h1>
          {location.notes && (
            <p className="text-sm text-muted-foreground mt-1">{location.notes}</p>
          )}
        </div>
        <RouteBadge status={routeStatus} />
      </div>

      {/* Non-encounter area notice */}
      {!location.is_encounter_area && (
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-sm text-muted-foreground text-center">
          No wild encounters at this location.
        </div>
      )}

      {/* Linked Trio — main section */}
      {location.is_encounter_area && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Swords className="h-4 w-4" /> Linked Trio
            </h2>
            {link && (
              <span className="text-xs text-muted-foreground">
                {encounters.filter(e => e.status !== 'missed').length}/3 caught
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {players.map(player => {
              const enc = byPlayer.get(player.id)
              const slot = player.player_slot as PlayerSlot
              const isMe = player.id === currentUserId

              return (
                <div key={player.id} className="flex flex-col gap-2">
                  {/* Player label */}
                  <div className={cn(
                    'text-xs font-semibold text-center py-1.5 rounded-lg border',
                    playerColorClass(slot)
                  )}>
                    {player.display_name}
                    {isMe && <span className="ml-1 opacity-60 text-[10px]">(you)</span>}
                  </div>

                  {enc ? (
                    <PokemonCard
                      encounter={enc}
                      player={player}
                      compact
                      onMarkDead={
                        !['dead', 'missed'].includes(enc.status)
                          ? () => openDeathModal(enc as any)
                          : undefined
                      }
                      onEdit={
                        isMe && !['dead'].includes(enc.status)
                          ? () => openAddModal(player.id)
                          : undefined
                      }
                    />
                  ) : (
                    <button
                      onClick={() => isMe && openAddModal(player.id)}
                      disabled={!isMe}
                      className={cn(
                        'rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-8 text-sm transition-all',
                        isMe
                          ? 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 cursor-pointer text-muted-foreground hover:text-foreground'
                          : 'border-muted/20 text-muted/30 cursor-default'
                      )}
                    >
                      {isMe ? (
                        <>
                          <Plus className="h-5 w-5" />
                          Log encounter
                        </>
                      ) : (
                        <span className="text-[11px]">Waiting...</span>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Death events */}
      {deathEvents.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-red-400 flex items-center gap-2">
            <Skull className="h-4 w-4" /> Deaths at this location
          </h2>
          {deathEvents.map(de => (
            <div key={de.id} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
              <div className="font-medium text-red-300">Linked death event</div>
              {de.cause && <div className="text-muted-foreground mt-0.5">Cause: {de.cause}</div>}
              {de.opponent && <div className="text-muted-foreground">Opponent: {de.opponent}</div>}
              {de.notes && <div className="text-muted-foreground italic mt-1">{de.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {currentPlayer && addModalOpen && (
        <AddEncounterModal
          open={addModalOpen}
          onClose={() => { setAddModalOpen(false); router.refresh() }}
          runId={runId}
          playerId={addForPlayerId || currentUserId}
          location={location}
        />
      )}

      {deathTarget && deathModalOpen && (
        <DeathConfirmModal
          open={deathModalOpen}
          onClose={() => { setDeathModalOpen(false); setDeathTarget(null); router.refresh() }}
          encounter={deathTarget.encounter}
          player={deathTarget.player}
          runId={runId}
          linkedPlayers={players.filter(p => p.id !== deathTarget.encounter.player_id)}
          linkedEncounters={linkedEncounters}
        />
      )}
    </div>
  )
}

function RouteBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    completed:   { label: 'Complete',     cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    in_progress: { label: 'In Progress',  cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    available:   { label: 'Available',    cls: 'bg-muted/30 text-muted-foreground border-border/30' },
    locked:      { label: 'Locked',       cls: 'bg-muted/10 text-muted-foreground/40 border-border/20' },
    skipped:     { label: 'Skipped',      cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  }
  const c = cfg[status] ?? cfg.available
  return <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', c.cls)}>{c.label}</span>
}
