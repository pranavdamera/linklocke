import { Card, CardContent } from '@/components/ui/card'
import { Skull, Shield, Package, HelpCircle, MapPin, Award, Swords } from 'lucide-react'

interface RunStats {
  totalEncounters: number
  totalAlive: number
  totalDead: number
  totalBoxed: number
  totalMissed: number
  totalChampion: number
  badgeCount: number
  routesComplete: number
  routesTotal: number
  byPlayer: {
    name: string
    alive: number
    dead: number
    slot: 1 | 2 | 3
  }[]
}

const SLOT_COLOR = {
  1: 'text-blue-400',
  2: 'text-green-400',
  3: 'text-purple-400',
} as const

export function StatsCards({ stats }: { stats: RunStats }) {
  return (
    <div className="space-y-4">
      {/* Main stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Shield className="h-5 w-5 text-blue-400" />}
          label="Alive"
          value={stats.totalAlive}
          color="text-blue-400"
        />
        <StatCard
          icon={<Skull className="h-5 w-5 text-red-400" />}
          label="Dead"
          value={stats.totalDead}
          color="text-red-400"
        />
        <StatCard
          icon={<Package className="h-5 w-5 text-gray-400" />}
          label="Boxed"
          value={stats.totalBoxed}
          color="text-gray-400"
        />
        <StatCard
          icon={<HelpCircle className="h-5 w-5 text-yellow-400" />}
          label="Missed"
          value={stats.totalMissed}
          color="text-yellow-400"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={<Award className="h-5 w-5 text-yellow-300" />}
          label="Badges"
          value={`${stats.badgeCount}/8`}
          color="text-yellow-300"
        />
        <StatCard
          icon={<MapPin className="h-5 w-5 text-green-400" />}
          label="Routes Done"
          value={`${stats.routesComplete}/${stats.routesTotal}`}
          color="text-green-400"
        />
        <StatCard
          icon={<Swords className="h-5 w-5 text-purple-400" />}
          label="Total Caught"
          value={stats.totalEncounters}
          color="text-purple-400"
        />
      </div>

      {/* Per-player deaths */}
      {stats.byPlayer.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/60 p-4">
          <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Skull className="h-4 w-4" /> Deaths by player
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stats.byPlayer.map(p => (
              <div key={p.name} className="text-center">
                <div className={`text-2xl font-bold ${SLOT_COLOR[p.slot]}`}>{p.dead}</div>
                <div className="text-xs text-muted-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground/60">{p.alive} alive</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number | string; color: string
}) {
  return (
    <Card className="bg-card/60">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <div className={`text-xl font-bold ${color}`}>{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
