'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Profile, PlayerSlot } from '@/lib/db/types'

const PLAYER_SLOTS: { slot: PlayerSlot; color: string }[] = [
  { slot: 1, color: 'text-blue-400' },
  { slot: 2, color: 'text-green-400' },
  { slot: 3, color: 'text-purple-400' },
]

export function ProfileSetup({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [slot, setSlot] = useState<string>(String(profile?.player_slot ?? '1'))
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    if (!displayName.trim()) return toast.error('Name required')
    setLoading(true)

    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', userId)
      if (error) { toast.error(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase
        .from('profiles')
        .insert({ id: userId, display_name: displayName.trim(), player_slot: parseInt(slot) })
      if (error) { toast.error(error.message); setLoading(false); return }
    }

    toast.success('Profile saved!')
    setLoading(false)
    router.refresh()
  }

  return (
    <Card className="bg-card/60">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-1.5">
          <Label>Display Name</Label>
          <Input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {!profile && (
          <div className="space-y-1.5">
            <Label>Player Slot</Label>
            <Select value={slot} onValueChange={setSlot}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAYER_SLOTS.map(s => (
                  <SelectItem key={s.slot} value={String(s.slot)}>
                    <span className={s.color}>Slot {s.slot}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Each slot can only be claimed once.</p>
          </div>
        )}

        {profile && (
          <div className="text-xs text-muted-foreground">
            Player slot: {profile.player_slot} · Slots cannot be changed after creation.
          </div>
        )}

        <Button onClick={handleSave} loading={loading} size="sm">
          {profile ? 'Update Profile' : 'Create Profile'}
        </Button>
      </CardContent>
    </Card>
  )
}
