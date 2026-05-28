'use client'

import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toggleRule } from '@/lib/actions/runs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Rule } from '@/lib/db/types'
import { RULES_TEMPLATE } from '@/lib/pokemon/rules'
import { useState } from 'react'

const CATEGORIES = ['standard', 'clause', 'hardcore', 'location'] as const
const CAT_LABELS: Record<string, string> = {
  standard: 'Standard Nuzlocke / Linklocke',
  clause:   'Optional Clauses',
  hardcore: 'Hardcore Mode',
  location: 'Location Rules',
}

export function RulesClient({ rules, runId }: { rules: Rule[]; runId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState<Set<string>>(new Set())

  const rulesByKey = new Map(rules.map(r => [r.key, r]))
  const templateByKey = new Map(RULES_TEMPLATE.map(t => [t.key, t]))

  async function handleToggle(key: string, enabled: boolean) {
    setPending(p => new Set(p).add(key))
    const result = await toggleRule(runId, key, enabled)
    setPending(p => { const n = new Set(p); n.delete(key); return n })
    if ('error' in result) {
      toast.error('Failed to update rule')
    } else {
      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {CATEGORIES.map(cat => {
        const catRules = RULES_TEMPLATE.filter(t => t.category === cat)
        return (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {CAT_LABELS[cat]}
            </h2>
            <Card className="bg-card/60 overflow-hidden">
              <CardContent className="p-0">
                {catRules.map((template, i) => {
                  const rule = rulesByKey.get(template.key)
                  const enabled = rule?.enabled ?? template.defaultEnabled
                  const isLocked = template.key === 'first_encounter_only' || template.key === 'permadeath' || template.key === 'mandatory_nickname'

                  return (
                    <div key={template.key}>
                      {i > 0 && <Separator />}
                      <div className="flex items-start gap-4 px-4 py-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {template.label}
                            {isLocked && <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">core rule</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{template.description}</div>
                        </div>
                        <Switch
                          checked={enabled}
                          disabled={isLocked || pending.has(template.key)}
                          onCheckedChange={v => !isLocked && handleToggle(template.key, v)}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
