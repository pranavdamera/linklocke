'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { searchPokemon, getPokemonByName, type PokemonData } from '@/lib/pokemon/pokemon-data'
import { NATURES, TYPE_COLORS, STATUS_LABELS } from '@/lib/db/types'
import { addEncounter, markMissed } from '@/lib/actions/encounters'
import { toast } from 'sonner'
import Image from 'next/image'
import { Search, X, Star } from 'lucide-react'
import type { Location } from '@/lib/db/types'

interface AddEncounterModalProps {
  open: boolean
  onClose: () => void
  runId: string
  playerId: string
  location: Location
  existingEncounterId?: string
}

export function AddEncounterModal({ open, onClose, runId, playerId, location, existingEncounterId }: AddEncounterModalProps) {
  const [step, setStep] = useState<'status' | 'details'>('status')
  const [loading, setLoading] = useState(false)
  const [isMissed, setIsMissed] = useState(false)

  // Pokemon search
  const [query, setQuery] = useState('')
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonData | null>(null)
  const results = query.length >= 1 ? searchPokemon(query, 8) : []

  // Form fields
  const [nickname, setNickname] = useState('')
  const [level, setLevel] = useState('')
  const [gender, setGender] = useState('')
  const [nature, setNature] = useState('')
  const [ability, setAbility] = useState('')
  const [status, setStatus] = useState('caught')
  const [method, setMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [isShiny, setIsShiny] = useState(false)
  const [isGift, setIsGift] = useState(false)
  const [isStatic, setIsStatic] = useState(false)

  function reset() {
    setStep('status')
    setQuery('')
    setSelectedPokemon(null)
    setNickname('')
    setLevel('')
    setGender('')
    setNature('')
    setAbility('')
    setStatus('caught')
    setMethod('')
    setNotes('')
    setIsShiny(false)
    setIsGift(false)
    setIsStatic(false)
    setIsMissed(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function selectPokemon(p: PokemonData) {
    setSelectedPokemon(p)
    setQuery(p.name)
  }

  async function handleSubmit() {
    if (isMissed) {
      setLoading(true)
      const result = await markMissed({
        run_id: runId,
        location_id: location.id,
        player_id: playerId,
        notes: notes || null,
      })
      setLoading(false)
      if ('error' in result) {
        toast.error('Failed to mark as missed')
        return
      }
      toast.success('Marked as missed')
      handleClose()
      return
    }

    if (!selectedPokemon && !query.trim()) {
      toast.error('Please select a Pokémon')
      return
    }

    setLoading(true)
    const pokemonData = selectedPokemon ?? getPokemonByName(query.trim())
    const spriteUrl = pokemonData
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${isShiny ? 'shiny/' : ''}${pokemonData.id}.png`
      : undefined

    const result = await addEncounter({
      run_id: runId,
      location_id: location.id,
      player_id: playerId,
      pokemon_name: pokemonData?.name ?? query.trim(),
      species: pokemonData?.name,
      pokedex_number: pokemonData?.id,
      nickname: nickname.trim() || null,
      level_met: level ? parseInt(level) : null,
      level_current: level ? parseInt(level) : null,
      gender: (gender as any) || null,
      nature: nature || null,
      ability: ability.trim() || null,
      sprite_url: spriteUrl || null,
      types: pokemonData?.types as string[] ?? null,
      status: status as any,
      is_shiny: isShiny,
      is_gift: isGift,
      is_static: isStatic,
      met_method: (method as any) || null,
      notes: notes.trim() || null,
    })

    setLoading(false)

    if ('error' in result) {
      toast.error('Failed to save encounter')
      return
    }

    toast.success(`${nickname || pokemonData?.name || query} saved!`)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Add Encounter</span>
            <span className="text-sm font-normal text-muted-foreground">— {location.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Caught / Missed toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsMissed(false)}
              className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                !isMissed ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              Caught
            </button>
            <button
              onClick={() => setIsMissed(true)}
              className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                isMissed ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'border-border/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              Missed
            </button>
          </div>

          {isMissed ? (
            <Textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          ) : (
            <>
              {/* Pokémon search */}
              <div className="space-y-1.5">
                <Label>Pokémon *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search (e.g. Patrat, Pidove...)"
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      if (selectedPokemon && e.target.value !== selectedPokemon.name) setSelectedPokemon(null)
                    }}
                    className="pl-9"
                  />
                  {query && (
                    <button onClick={() => { setQuery(''); setSelectedPokemon(null) }} className="absolute right-3 top-3">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Search results */}
                {results.length > 0 && !selectedPokemon && (
                  <div className="border border-border/50 rounded-lg bg-popover overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                    {results.map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectPokemon(p)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-sm text-left"
                      >
                        <Image
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                          alt={p.name}
                          width={32} height={32}
                          unoptimized
                          className="object-contain"
                        />
                        <span className="flex-1">{p.name}</span>
                        <div className="flex gap-1">
                          {p.types.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded text-white/80 font-medium"
                              style={{ backgroundColor: TYPE_COLORS[t] + 'cc' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Pokémon preview */}
                {selectedPokemon && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/30">
                    <Image
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${isShiny ? 'shiny/' : ''}${selectedPokemon.id}.png`}
                      alt={selectedPokemon.name}
                      width={40} height={40}
                      unoptimized className="object-contain"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{selectedPokemon.name}</div>
                      <div className="flex gap-1 mt-0.5">
                        {selectedPokemon.types.map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded text-white/80 font-medium"
                            style={{ backgroundColor: TYPE_COLORS[t] + 'cc' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setIsShiny(!isShiny)} className={`text-xs ${isShiny ? 'text-yellow-300' : 'text-muted-foreground'}`}>
                      ✨ Shiny
                    </button>
                  </div>
                )}
              </div>

              {/* Nickname + Level */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nickname</Label>
                  <Input placeholder="Optional" value={nickname} onChange={e => setNickname(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Level</Label>
                  <Input type="number" placeholder="e.g. 5" min={1} max={100} value={level} onChange={e => setLevel(e.target.value)} />
                </div>
              </div>

              {/* Gender + Nature */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Unknown" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">♂ Male</SelectItem>
                      <SelectItem value="female">♀ Female</SelectItem>
                      <SelectItem value="genderless">⚪ Genderless</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nature</Label>
                  <Select value={nature} onValueChange={setNature}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      {NATURES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ability + Method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Ability</Label>
                  <Input placeholder="e.g. Intimidate" value={ability} onChange={e => setAbility(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger><SelectValue placeholder="Grass" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grass">Grass</SelectItem>
                      <SelectItem value="surf">Surfing</SelectItem>
                      <SelectItem value="fishing">Fishing</SelectItem>
                      <SelectItem value="cave">Cave</SelectItem>
                      <SelectItem value="dark_grass">Dark Grass</SelectItem>
                      <SelectItem value="dust_cloud">Dust Cloud</SelectItem>
                      <SelectItem value="gift">Gift</SelectItem>
                      <SelectItem value="static">Static</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caught">Caught (box)</SelectItem>
                    <SelectItem value="active">Active (on team)</SelectItem>
                    <SelectItem value="boxed">Boxed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isMissed ? 'Mark Missed' : 'Save Encounter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
