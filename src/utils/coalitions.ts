import { Party } from '../data/parliamentData';

export interface Majority {
  ids: string[];
  seats: number;
}

/**
 * Minimal winning coalitions: combinations that reach `target` seats where removing
 * any single member drops them below it. Fewest parties first, then tightest margin.
 */
export function minimalMajorities(
  parties: Party[],
  totals: Record<string, number>,
  target: number,
  limit = 8
): Majority[] {
  const list = parties
    .map((p) => ({ id: p.id, n: totals[p.id] || 0 }))
    .filter((p) => p.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 18);
  const m = list.length;
  if (m === 0 || list.reduce((s, p) => s + p.n, 0) < target) return [];

  const sums = new Int32Array(1 << m);
  const found: Majority[] = [];
  for (let mask = 1; mask < 1 << m; mask++) {
    const low = mask & -mask;
    const bit = 31 - Math.clz32(low);
    sums[mask] = sums[mask ^ low] + list[bit].n;
    if (sums[mask] < target) continue;

    let minimal = true;
    for (let b = 0; b < m && minimal; b++) {
      if (mask & (1 << b) && sums[mask] - list[b].n >= target) minimal = false;
    }
    if (minimal) {
      found.push({
        ids: list.filter((_, b) => mask & (1 << b)).map((p) => p.id),
        seats: sums[mask]
      });
    }
  }

  found.sort((a, b) => a.ids.length - b.ids.length || a.seats - b.seats);
  return found.slice(0, limit);
}

/** Parties that, added to the current selection, reach the target. Smallest sufficient first. */
export function completers(
  parties: Party[],
  totals: Record<string, number>,
  selected: Set<string>,
  target: number
): { id: string; seats: number }[] {
  const current = parties.reduce((s, p) => s + (selected.has(p.id) ? totals[p.id] || 0 : 0), 0);
  return parties
    .filter((p) => !selected.has(p.id) && (totals[p.id] || 0) > 0 && current + totals[p.id] >= target)
    .map((p) => ({ id: p.id, seats: current + totals[p.id] }))
    .sort((a, b) => a.seats - b.seats);
}
