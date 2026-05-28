'use client'

import { useState } from 'react'
import { Copy, Check, Users } from 'lucide-react'

export function InviteCode({ runId, runName }: { runId: string; runName: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(runId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <Users className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">Invite others — share this run code</p>
        <p className="text-xs font-mono text-foreground/70 truncate mt-0.5">{runId}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
