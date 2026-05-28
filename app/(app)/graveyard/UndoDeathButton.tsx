'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { undoDeath } from '@/lib/actions/deaths'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UndoDeathButton({ deathEventId, runId }: { deathEventId: string; runId: string }) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const router = useRouter()

  async function handleUndo() {
    if (!confirmed) {
      setConfirmed(true)
      setTimeout(() => setConfirmed(false), 3000)
      return
    }
    setLoading(true)
    const result = await undoDeath({ death_event_id: deathEventId, run_id: runId })
    setLoading(false)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Death undone — Pokémon revived!')
      router.refresh()
    }
    setConfirmed(false)
  }

  return (
    <Button
      variant={confirmed ? 'destructive' : 'ghost'}
      size="icon-sm"
      onClick={handleUndo}
      loading={loading}
      title={confirmed ? 'Click again to confirm undo' : 'Undo death'}
    >
      <RotateCcw className="h-3.5 w-3.5" />
    </Button>
  )
}
