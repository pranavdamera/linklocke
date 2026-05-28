'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createRun } from '@/lib/actions/runs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/db/types'

interface CreateRunFormProps {
  userId: string
  profile: Profile | null
}

export function CreateRunForm({ userId, profile }: CreateRunFormProps) {
  const [name, setName] = useState('Ototos Linklocke')
  const [gameVersion, setGameVersion] = useState<'Black' | 'White'>('Black')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!profile) {
      toast.error('Please set up your profile first.')
      return
    }
    setLoading(true)
    const result = await createRun({
      name,
      game: 'pokemon_black_white',
      region: 'unova',
      players: [{
        profile_id: userId,
        player_name: profile.display_name,
        slot: profile.player_slot,
        game_version: gameVersion,
      }],
    })
    setLoading(false)

    if ('error' in result) {
      toast.error('Failed to create run')
      return
    }

    toast.success('Run created! Invite your friends.')
    router.refresh()
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">You need a profile before creating a run.</p>
          <p className="text-xs text-muted-foreground">Ask an admin to seed profiles or sign up first.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Run Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ototos Linklocke" />
        </div>
        <div className="space-y-1.5">
          <Label>Your Game Version</Label>
          <Select value={gameVersion} onValueChange={v => setGameVersion(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Black">Pokémon Black</SelectItem>
              <SelectItem value="White">Pokémon White</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full" onClick={handleCreate} loading={loading}>
          Create Run
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Chach and Cheek can join after signing up and being added to the run in Settings.
        </p>
      </CardContent>
    </Card>
  )
}
