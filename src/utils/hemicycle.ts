import { Party } from '../data/parliamentData';

export interface Seat {
  x: number;
  y: number;
  angle: number;
  r: number;
}

export interface HemicycleLayout {
  seats: Seat[]; // sorted left to right
  dot: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  rInner: number;
  rOuter: number;
}

/** Classic parliament arc: rows of seats, sorted by angle so parties form wedges. */
export function computeHemicycle(total: number, R = 300): HemicycleLayout {
  const rows = Math.max(3, Math.round(Math.sqrt(total / 3.4)));
  const pad = 10;
  const rOuter = R - pad;
  const rInner = rOuter * 0.42;
  const radii = Array.from({ length: rows }, (_, i) => rInner + ((rOuter - rInner) * i) / (rows - 1));
  const sumR = radii.reduce((a, b) => a + b, 0);

  const raw = radii.map((r) => (total * r) / sumR);
  const counts = raw.map(Math.floor);
  const rest = total - counts.reduce((a, b) => a + b, 0);
  raw
    .map((v, i) => ({ i, f: v - Math.floor(v) }))
    .sort((a, b) => b.f - a.f)
    .slice(0, rest)
    .forEach(({ i }) => {
      counts[i]++;
    });

  const rowGap = (rOuter - rInner) / (rows - 1);
  const minArc = Math.min(...radii.map((r, i) => (Math.PI * r) / counts[i]));
  const dot = Math.min(rowGap, minArc) * 0.5 * 0.88;

  const cx = R;
  const cy = R;
  const seats: Seat[] = [];
  radii.forEach((r, i) => {
    for (let j = 0; j < counts[i]; j++) {
      const angle = Math.PI * (1 - (j + 0.5) / counts[i]);
      seats.push({ x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle), angle, r });
    }
  });
  seats.sort((a, b) => b.angle - a.angle || a.r - b.r);

  return { seats, dot, width: 2 * R, height: R + pad, cx, cy, rInner, rOuter };
}

// Conventional left-to-right seating order used for the chart only
const ORDER = [
  'C-FV', 'UPC', 'BNG', 'EH Bildu', 'FA', 'Podemos', 'Compromís', 'PSOE',
  'ERC', 'Junts', 'PNV', 'CC', 'AHI', 'ASG', 'AA', 'UPN-PP', 'UPN', 'PP', 'Vox'
];

export function hemicycleOrder(parties: Party[]): Party[] {
  const known = ORDER.map((id) => parties.find((p) => p.id === id)).filter((p): p is Party => !!p);
  const custom = parties.filter((p) => !ORDER.includes(p.id));
  return [...known, ...custom];
}

/** One entry per seat (left to right): party id, or null for unassigned seats. */
export function seatOwners(
  total: number,
  parties: Party[],
  partyTotals: Record<string, number>
): (string | null)[] {
  const owners: (string | null)[] = [];
  hemicycleOrder(parties).forEach((p) => {
    const n = partyTotals[p.id] || 0;
    for (let i = 0; i < n && owners.length < total; i++) owners.push(p.id);
  });
  while (owners.length < total) owners.push(null);
  return owners;
}
