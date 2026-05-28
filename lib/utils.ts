import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import type { PokemonStatus, PlayerSlot } from './db/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function spriteUrl(dexNumber: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNumber}.png`
}

export function spriteUrlShiny(dexNumber: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${dexNumber}.png`
}

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy')
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d h:mm a')
}

export function statusColor(status: PokemonStatus): string {
  const map: Record<PokemonStatus, string> = {
    caught: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    missed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    boxed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    dead: 'bg-red-500/20 text-red-400 border-red-500/30',
    released: 'bg-gray-600/20 text-gray-500 border-gray-600/30',
    champion: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
  }
  return map[status] ?? 'bg-gray-500/20 text-gray-400'
}

export function playerColorClass(slot: PlayerSlot): string {
  const map: Record<PlayerSlot, string> = {
    1: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    2: 'text-green-400 border-green-400/30 bg-green-400/10',
    3: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  }
  return map[slot]
}

export function playerBorderColor(slot: PlayerSlot): string {
  const map: Record<PlayerSlot, string> = {
    1: 'border-blue-400/40',
    2: 'border-green-400/40',
    3: 'border-purple-400/40',
  }
  return map[slot]
}

export function playerGlow(slot: PlayerSlot): string {
  const map: Record<PlayerSlot, string> = {
    1: 'shadow-blue-500/20',
    2: 'shadow-green-500/20',
    3: 'shadow-purple-500/20',
  }
  return map[slot]
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function titleCase(str: string): string {
  return str.split(/[\s_-]/).map(capitalize).join(' ')
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function computeRunCompletion(
  total: number,
  completed: number
): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function getDeathFlavorText(cause?: string | null): string {
  if (!cause) return 'fell in battle'
  const lower = cause.toLowerCase()
  if (lower.includes('poison')) return 'was poisoned to death'
  if (lower.includes('burn')) return 'burned to ash'
  if (lower.includes('sweep') || lower.includes('crit')) return 'got swept'
  if (lower.includes('crit')) return 'got one-shotted'
  return cause
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}
