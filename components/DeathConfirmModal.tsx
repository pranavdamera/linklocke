'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { markPokemonDead, type DeathResult } from '@/lib/actions/deaths'
import { toast } from 'sonner'
import { Skull, AlertTriangle, Link2, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import type { PokemonEncounter, Profile } from '@/lib/db/types'

interface DeathConfirmModalProps {
  open: boolean
  onClose: () => void
  encounter: PokemonEncounter
  player: Profile
  runId: string
  linkedPlayers?: Profile[]
  linkedEncounters?: PokemonEncounter[]
  onDeathConfirmed?: (result: DeathResult) => void
}

export function DeathConfirmModal({
  open, onClose, encounter, player, runId,
  linkedPlayers = [], linkedEncounters = [],
  onDeathConfirmed,
}: DeathConfirmModalProps) {
  const [confirmation, setConfirmation] = useState('')
  const [deathLocation, setDeathLocation] = useState('')
  const [cause, setCause] = useState('')
  const [opponent, setOpponent] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DeathResult | null>(null)

  const displayName = encounter.nickname ?? encounter.pokemon_name
  const linkedAlive = linkedEncounters.filter(e => !['dead', 'missed'].includes(e.status))
  const hasLinked = linkedAlive.length > 0
  const confirmPhrase = 'KILL LINK'

  function handleClose() {
    if (!loading) {
      setConfirmation('')
      setDeathLocation('')
      setCause('')
      setOpponent('')
      setNotes('')
      setResult(null)
      onClose()
    }
  }

  async function handleConfirm() {
    if (confirmation !== confirmPhrase) return

    setLoading(true)
    const res = await markPokemonDead({
      encounter_id: encounter.id,
      run_id: runId,
      death_location: deathLocation || null,
      cause: cause || null,
      opponent: opponent || null,
      notes: notes || null,
    })
    setLoading(false)

    if ('error' in res) {
      toast.error(res.error)
      return
    }

    setResult(res.result)
    onDeathConfirmed?.(res.result)
    toast.error(`${displayName} has fallen${res.result.linked_casualties.length > 0 ? ` — ${res.result.linked_casualties.length} linked death(s)!` : ''}`, {
      icon: '💀',
      duration: 5000,
    })
  }

  // Show result screen after death
  if (result) {
    return (
      <Dialog open={open} onOpenChange={open => !open && handleClose()}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4 py-2">
            <div className="text-5xl animate-bounce">💀</div>
            <div>
              <h2 className="text-xl font-bold text-red-400">Linked Death Triggered</h2>
              <p className="text-sm text-muted-foreground mt-1">The link has been broken</p>
            </div>

            {/* Trigger */}
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-muted-foreground mb-1">Trigger</div>
              <div className="font-semibold text-red-300">
                {result.trigger_pokemon.nickname ?? result.trigger_pokemon.pokemon_name}
                <span className="text-muted-foreground font-normal ml-1">({result.trigger_pokemon.player_name})</span>
              </div>
            </div>

            {/* Linked casualties */}
            {result.linked_casualties.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  Linked casualties
                </div>
                {result.linked_casualties.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 text-sm">
                    <Skull className="h-4 w-4 text-red-400 shrink-0" />
                    <span className="text-red-300 font-medium">{c.nickname ?? c.pokemon_name}</span>
                    <span className="text-muted-foreground ml-auto text-xs">({c.player_name})</span>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={handleClose} className="w-full" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-md border-red-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <Skull className="h-5 w-5" />
            Mark as Dead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pokémon being killed */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            {encounter.sprite_url && (
              <Image
                src={encounter.sprite_url}
                alt={encounter.pokemon_name}
                width={48} height={48}
                unoptimized className="object-contain grayscale"
              />
            )}
            <div>
              <div className="font-bold">{displayName}</div>
              <div className="text-sm text-muted-foreground">{player.display_name}'s {encounter.pokemon_name}</div>
            </div>
          </div>

          {/* Linked warning */}
          {hasLinked && (
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                Linked Death Warning
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                This will also kill the following linked Pokémon:
              </div>
              <div className="space-y-1.5">
                {linkedAlive.map(enc => {
                  const p = linkedPlayers.find(pl => pl.id === enc.player_id)
                  return (
                    <div key={enc.id} className="flex items-center gap-2 text-sm">
                      {enc.sprite_url && (
                        <Image src={enc.sprite_url} alt={enc.pokemon_name} width={24} height={24} unoptimized className="object-contain" />
                      )}
                      <span className="font-medium">{enc.nickname ?? enc.pokemon_name}</span>
                      <span className="text-muted-foreground">({p?.display_name ?? 'Unknown'})</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Death details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Death Location</Label>
              <Input placeholder="e.g. Route 4" value={deathLocation} onChange={e => setDeathLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Opponent / Move</Label>
              <Input placeholder="e.g. Gym Leader Lenora" value={opponent} onChange={e => setOpponent(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cause</Label>
            <Input placeholder="e.g. Crit Hyper Voice, Poison, etc." value={cause} onChange={e => setCause(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="What happened?" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          {/* Confirmation input */}
          <div className="space-y-1.5">
            <Label className="text-red-400">
              Type <code className="bg-red-500/20 px-1 rounded font-mono">{confirmPhrase}</code> to confirm
            </Label>
            <Input
              placeholder={confirmPhrase}
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
              className="border-red-500/30 focus-visible:ring-red-500/50"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={confirmation !== confirmPhrase || loading}
            loading={loading}
          >
            <Skull className="h-4 w-4 mr-1" />
            Confirm Death
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
