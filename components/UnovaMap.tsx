'use client'

import { MAP_NODES, MAP_EDGES, SLOT_COLORS, getNodeForOrderIndex } from '@/lib/pokemon/unova-map-data'
import type { Profile } from '@/lib/db/types'

interface PlayerPosition {
  player: Profile
  maxOrderIndex: number
  locationName: string
}

interface UnovaMapProps {
  playerPositions: PlayerPosition[]
  badgeCount: number
}

const NODE_R = { gym: 14, start: 10, route: 7, end: 13 }
const BADGE_GATE = [0, 0, 5, 8, 11, 14, 16, 19, 23] // min order for each gym badge gate

export function UnovaMap({ playerPositions, badgeCount }: UnovaMapProps) {
  const W = 800, H = 470

  // Build edge path strings
  function edgePath(from: string, to: string, curve?: [number, number, number, number]) {
    const a = MAP_NODES.find(n => n.id === from)!
    const b = MAP_NODES.find(n => n.id === to)!
    if (curve) {
      return `M ${a.x} ${a.y} C ${curve[0]} ${curve[1]}, ${curve[2]} ${curve[3]}, ${b.x} ${b.y}`
    }
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
  }

  // Cluster players at the same node offset so they don't overlap
  const positionsByNode = new Map<string, PlayerPosition[]>()
  for (const pp of playerPositions) {
    const node = getNodeForOrderIndex(pp.maxOrderIndex)
    const arr = positionsByNode.get(node.id) ?? []
    arr.push(pp)
    positionsByNode.set(node.id, arr)
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border/40 bg-[#0a0f1a]">
      {/* Title bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <span className="text-xs font-semibold text-white/70 tracking-widest uppercase">Unova · Live Map</span>
        <span className="text-xs text-white/40">{badgeCount}/8 badges</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ maxHeight: 340 }}
      >
        <defs>
          {/* Glow filter for paths */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Radial gradients for gym nodes */}
          {MAP_NODES.filter(n => n.type === 'gym').map(n => (
            <radialGradient key={n.id} id={`grad-${n.id}`} cx="40%" cy="35%">
              <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#92400e" stopOpacity="0.7" />
            </radialGradient>
          ))}
        </defs>

        {/* Background subtle grid dots */}
        <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="0.8" fill="#1e3a5f" opacity="0.5" />
        </pattern>
        <rect width={W} height={H} fill="url(#dots)" />

        {/* Edges (routes) */}
        {MAP_EDGES.map((edge, i) => (
          <path
            key={i}
            d={edgePath(edge.from, edge.to, edge.curve)}
            stroke="#1d4ed8"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
            filter="url(#glow)"
          />
        ))}

        {/* Nodes */}
        {MAP_NODES.map(node => {
          const r = NODE_R[node.type]
          const isGym = node.type === 'gym'
          const isUnlocked = badgeCount >= (isGym ? (node.gym! - 1) : 0)
          const isBeaten = isGym && badgeCount >= node.gym!

          return (
            <g key={node.id}>
              {/* Outer ring for gyms */}
              {isGym && (
                <circle
                  cx={node.x} cy={node.y} r={r + 5}
                  fill="none"
                  stroke={isBeaten ? '#fcd34d' : '#1e40af'}
                  strokeWidth="1"
                  opacity={isBeaten ? 0.6 : 0.3}
                />
              )}

              {/* Node body */}
              <circle
                cx={node.x} cy={node.y} r={r}
                fill={isGym ? `url(#grad-${node.id})` : node.type === 'start' ? '#1e3a5f' : node.type === 'end' ? '#4c1d95' : '#0f2952'}
                stroke={isGym ? (isBeaten ? '#fcd34d' : '#1e40af') : '#1d4ed8'}
                strokeWidth={isGym ? 2 : 1}
                opacity={isUnlocked ? 1 : 0.45}
                filter={isBeaten ? 'url(#node-glow)' : undefined}
              />

              {/* Gym number */}
              {isGym && (
                <text
                  x={node.x} y={node.y + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fontWeight="bold"
                  fill={isBeaten ? '#fef3c7' : '#93c5fd'}
                  opacity={isUnlocked ? 1 : 0.5}
                >
                  {node.gym}
                </text>
              )}

              {/* Label below */}
              <text
                x={node.x}
                y={node.y + r + 12}
                textAnchor="middle"
                fontSize="8.5"
                fill={isGym ? (isBeaten ? '#fde68a' : '#93c5fd') : '#64748b'}
                fontWeight={isGym ? '600' : '400'}
                opacity={isUnlocked ? 1 : 0.4}
              >
                {node.name}
              </text>

              {/* Beaten checkmark */}
              {isBeaten && (
                <text x={node.x + r - 2} y={node.y - r + 3} fontSize="8" fill="#fcd34d">✓</text>
              )}
            </g>
          )
        })}

        {/* Player position markers */}
        {MAP_NODES.map(node => {
          const here = positionsByNode.get(node.id) ?? []
          if (!here.length) return null

          return here.map((pp, idx) => {
            const slot = pp.player.player_slot as number
            const colors = SLOT_COLORS[slot] ?? SLOT_COLORS[1]
            // Offset clustered players so they don't stack
            const offsets = [
              [0, 0],
              [-14, 0],
              [14, 0],
            ]
            const [ox, oy] = offsets[idx] ?? [idx * 14, 0]
            const px = node.x + ox
            const py = node.y - NODE_R[node.type] - 22 + oy

            return (
              <g key={pp.player.id}>
                {/* Pulsing ring */}
                <circle cx={px} cy={py} r="10" fill={colors.fill} opacity="0.2">
                  <animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                </circle>

                {/* Player dot */}
                <circle
                  cx={px} cy={py} r="8"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="2"
                  filter="url(#node-glow)"
                />

                {/* Slot number in dot */}
                <text
                  x={px} y={py + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="8" fontWeight="bold"
                  fill="white"
                >
                  {slot}
                </text>

                {/* Name label */}
                <text
                  x={px} y={py - 12}
                  textAnchor="middle"
                  fontSize="8"
                  fill={colors.text}
                  fontWeight="600"
                >
                  {pp.player.display_name.split(' ')[0]}
                </text>
              </g>
            )
          })
        })}

        {/* Start label */}
        <text x={682} y={460} textAnchor="middle" fontSize="8" fill="#334155">START</text>
        {/* End label */}
        <text x={522} y={28} textAnchor="middle" fontSize="8" fill="#7c3aed">E4</text>
      </svg>

      {/* Player legend */}
      <div className="flex flex-wrap gap-3 px-4 pb-3 pt-1 border-t border-white/5">
        {playerPositions.map(pp => {
          const slot = pp.player.player_slot as number
          const colors = SLOT_COLORS[slot] ?? SLOT_COLORS[1]
          const node = getNodeForOrderIndex(pp.maxOrderIndex)
          return (
            <div key={pp.player.id} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 border"
                style={{ background: colors.fill, borderColor: colors.stroke }}
              />
              <span className="text-white/80 font-medium">{pp.player.display_name}</span>
              <span className="text-white/35">—</span>
              <span style={{ color: colors.text }}>{pp.locationName || node.name}</span>
            </div>
          )
        })}
        {playerPositions.length === 0 && (
          <span className="text-xs text-white/30">No encounters recorded yet — positions update as you play.</span>
        )}
      </div>
    </div>
  )
}
