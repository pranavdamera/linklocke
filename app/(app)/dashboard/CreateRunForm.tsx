'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createRun, joinRun } from '@/lib/actions/runs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/db/types'
import { Copy, Check, Users, Plus, LogIn } from 'lucide-react'
import Link from 'next/link'

interface CreateRunFormProps {
  userId: string
  profile: Profile | null
}

export function CreateRunForm({ userId, profile }: CreateRunFormProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const router = useRouter()

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <div className="text-3xl">👤</div>
          <p className="font-medium">Set up your profile first</p>
          <p className="text-sm text-muted-foreground">
            Before creating or joining a run, choose a display name and player slot.
          </p>
          <Button asChild className="w-full">
            <Link href="/settings">Go to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setTab('create')}
          className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'create' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Plus className="h-4 w-4" /> Create run
        </button>
        <button
          onClick={() => setTab('join')}
          className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'join' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <LogIn className="h-4 w-4" /> Join run
        </button>
      </div>

      {tab === 'create' && <CreateTab userId={userId} profile={profile} />}
      {tab === 'join'   && <JoinTab profile={profile} />}
    </div>
  )
}

function CreateTab({ userId, profile }: { userId: string; profile: Profile }) {
  const [name, setName] = useState('')
  const [gameVersion, setGameVersion] = useState<'Black' | 'White'>('Black')
  const [loading, setLoading] = useState(false)
  const [createdRunId, setCreatedRunId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!name.trim()) return toast.error('Give your run a name')
    setLoading(true)
    const result = await createRun({
      name: name.trim(),
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
    if ('error' in result) { toast.error('Failed to create run'); return }
    setCreatedRunId(result.run_id!)
  }

  async function copyCode() {
    if (!createdRunId) return
    await navigator.clipboard.writeText(createdRunId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (createdRunId) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4 text-center">
          <div className="text-3xl">🎉</div>
          <div>
            <p className="font-semibold">Run created!</p>
            <p className="text-sm text-muted-foreground mt-1">Share this code with your friends so they can join.</p>
          </div>

          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-mono">
            <span className="flex-1 truncate text-xs text-muted-foreground">{createdRunId}</span>
            <button onClick={copyCode} className="shrink-0 hover:text-foreground transition-colors">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Your friends go to <strong>Dashboard → Join run</strong> and paste this code.
          </p>

          <Button className="w-full" onClick={() => router.refresh()}>
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {profile.player_slot}
          </div>
          Joining as <span className="text-foreground font-medium">{profile.display_name}</span>
          <Link href="/settings" className="ml-auto text-xs text-primary hover:underline">Change</Link>
        </div>

        <div className="space-y-1.5">
          <Label>Run name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Summer Linklocke"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Your game version</Label>
          <Select value={gameVersion} onValueChange={v => setGameVersion(v as 'Black' | 'White')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Black">Pokémon Black</SelectItem>
              <SelectItem value="White">Pokémon White</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={handleCreate} loading={loading}>
          Create run
        </Button>
      </CardContent>
    </Card>
  )
}

function JoinTab({ profile }: { profile: Profile }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleJoin() {
    const trimmed = code.trim()
    if (!trimmed) return toast.error('Paste the run code')
    setLoading(true)
    const result = await joinRun(trimmed)
    setLoading(false)
    if ('error' in result) { toast.error(result.error); return }
    toast.success(`Joined "${result.run_name}"!`)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {profile.player_slot}
          </div>
          Joining as <span className="text-foreground font-medium">{profile.display_name}</span>
          <Link href="/settings" className="ml-auto text-xs text-primary hover:underline">Change</Link>
        </div>

        <div className="space-y-1.5">
          <Label>Run code</Label>
          <Input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Paste the run ID from your friend"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <p className="text-xs text-muted-foreground">Your friend can find this code on their dashboard after creating the run.</p>
        </div>

        <Button className="w-full" onClick={handleJoin} loading={loading}>
          Join run
        </Button>
      </CardContent>
    </Card>
  )
}
