import { Party } from '../data/parliamentData';

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
