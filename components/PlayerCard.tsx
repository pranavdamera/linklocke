import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn, playerColorClass } from '@/lib/utils'
import { PLAYER_NAMES } from '@/lib/db/types'
import type { Profile, PokemonEncounter, PlayerSlot } from '@/lib/db/types'
import Image from 'next/image'
import { Shield, Skull, Package, HelpCircle, Swords } from 'lucide-react'

interface PlayerCardProps {
  profile: Profile
  encounters?: PokemonEncounter[]
  gameVersion?: string
  compact?: boolean
}

const SLOT_ACCENT: Record<PlayerSlot, string> = {
  1: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
  2: 'from-green-500/20 to-green-500/5 border-green-500/20',
  3: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
}

export function PlayerCard({ profile, encounters = [], gameVersion, compact = false }: PlayerCardProps) {
  const slot = profile.player_slot as PlayerSlot
  const alive = encounters.filter(e => ['active', 'caught'].includes(e.status)).length
  const dead  = encounters.filter(e => e.status === 'dead').length
  const boxed = encounters.filter(e => e.status === 'boxed').length
  const missed = encounters.filter(e => e.status === 'missed').length
  const team  = encounters.filter(e => e.status === 'active').slice(0, 6)

  return (
    <Link href={`/players/${profile.id}`}>
      <div className={cn(
        'rounded-xl border bg-gradient-to-b p-4 hover:shadow-lg transition-all cursor-pointer',
        SLOT_ACCENT[slot],
        compact ? 'p-3' : 'p-4'
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className={cn('border-2', playerColorClass(slot).split(' ').filter(c => c.startsWith('border')).join(' '))}>
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.display_name} width={40} height={40} />
            ) : (
              <AvatarFallback className={cn('font-bold', playerColorClass(slot).split(' ').find(c => c.startsWith('text'))!)}>
                {profile.display_name[0].toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0">
            <div className={cn('font-bold text-base leading-none', playerColorClass(slot).split(' ').find(c => c.startsWith('text'))!)}>
              {profile.display_name}
            </div>
            {gameVersion && (
              <div className="text-xs text-muted-foreground mt-0.5">Pokémon {gameVersion}</div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1 mb-3">
          <Stat icon={<Shield className="w-3 h-3 text-blue-400" />}  label="Active" value={alive}  color="text-blue-400"   />
          <Stat icon={<Skull className="w-3 h-3 text-red-400" />}    label="Dead"   value={dead}   color="text-red-400"    />
          <Stat icon={<Package className="w-3 h-3 text-gray-400" />} label="Boxed"  value={boxed}  color="text-gray-400"   />
          <Stat icon={<HelpCircle className="w-3 h-3 text-yellow-400" />} label="Miss" value={missed} color="text-yellow-400" />
        </div>

        {/* Active team sprites */}
        {!compact && team.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {team.map(enc => (
              <div key={enc.id} className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center" title={enc.nickname ?? enc.pokemon_name}>
                {enc.sprite_url ? (
                  <Image src={enc.sprite_url} alt={enc.pokemon_name} width={32} height={32} unoptimized className="object-contain" />
                ) : (
                  <Swords className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
            {team.length === 0 && <span className="text-xs text-muted-foreground">No active Pokémon</span>}
          </div>
        )}
      </div>
    </Link>
  )
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-muted/30 rounded-lg py-1.5">
      {icon}
      <span className={cn('text-sm font-bold leading-none', color)}>{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase">{label}</span>
    </div>
  )
}
