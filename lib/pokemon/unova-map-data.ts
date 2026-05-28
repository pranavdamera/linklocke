export interface MapNode {
  id: string
  name: string
  x: number
  y: number
  type: 'start' | 'route' | 'gym' | 'end'
  gym?: number
  orderRange: [number, number]
}

export interface MapEdge {
  from: string
  to: string
  // SVG cubic bezier control points [cx1,cy1, cx2,cy2] — omit for straight line
  curve?: [number, number, number, number]
}

// Coordinates are in an 800×470 viewBox.
// Positions are approximate to the actual BW Unova map layout.
export const MAP_NODES: MapNode[] = [
  { id: 'nuvema',     name: 'Nuvema Town',    x: 682, y: 432, type: 'start', orderRange: [1,  2] },
  { id: 'striaton',   name: 'Striaton',        x: 385, y: 375, type: 'gym',   gym: 1, orderRange: [3, 5] },
  { id: 'nacrene',    name: 'Nacrene',         x: 185, y: 308, type: 'gym',   gym: 2, orderRange: [6, 8] },
  { id: 'castelia',   name: 'Castelia',        x: 372, y: 252, type: 'gym',   gym: 3, orderRange: [9, 11] },
  { id: 'nimbasa',    name: 'Nimbasa',         x: 485, y: 202, type: 'gym',   gym: 4, orderRange: [12, 14] },
  { id: 'driftveil',  name: 'Driftveil',       x: 355, y: 165, type: 'gym',   gym: 5, orderRange: [15, 16] },
  { id: 'mistralton', name: 'Mistralton',      x: 222, y: 132, type: 'gym',   gym: 6, orderRange: [17, 19] },
  { id: 'icirrus',    name: 'Icirrus',         x: 103, y: 98,  type: 'gym',   gym: 7, orderRange: [20, 23] },
  { id: 'opelucid',   name: 'Opelucid',        x: 522, y: 100, type: 'gym',   gym: 8, orderRange: [24, 27] },
  { id: 'victory',    name: 'Victory Road',    x: 522, y: 52,  type: 'end',          orderRange: [28, 29] },
]

export const MAP_EDGES: MapEdge[] = [
  { from: 'nuvema',     to: 'striaton'  },
  { from: 'striaton',   to: 'nacrene',   curve: [305, 365, 215, 340] },
  { from: 'nacrene',    to: 'castelia',  curve: [205, 270, 310, 255] },
  { from: 'castelia',   to: 'nimbasa'   },
  { from: 'nimbasa',    to: 'driftveil' },
  { from: 'driftveil',  to: 'mistralton'},
  { from: 'mistralton', to: 'icirrus'   },
  // Big arc across the top from Icirrus to Opelucid
  { from: 'icirrus',    to: 'opelucid',  curve: [240, 52, 420, 48] },
  { from: 'opelucid',   to: 'victory'   },
]

export function getNodeForOrderIndex(orderIndex: number): MapNode {
  if (orderIndex <= 0) return MAP_NODES[0]
  // Find the node whose orderRange includes the index; fall back to nearest
  for (let i = MAP_NODES.length - 1; i >= 0; i--) {
    if (orderIndex >= MAP_NODES[i].orderRange[0]) return MAP_NODES[i]
  }
  return MAP_NODES[0]
}

// Slot colors matching the app theme
export const SLOT_COLORS: Record<number, { fill: string; stroke: string; text: string }> = {
  1: { fill: '#3b82f6', stroke: '#93c5fd', text: '#bfdbfe' },
  2: { fill: '#22c55e', stroke: '#86efac', text: '#bbf7d0' },
  3: { fill: '#a855f7', stroke: '#d8b4fe', text: '#e9d5ff' },
}
