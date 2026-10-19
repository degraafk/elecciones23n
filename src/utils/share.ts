import {
  Party,
  Constituency,
  ScenarioData,
  PARTIES_CONGRESO,
  PARTIES_SENADO,
  PROVINCIAS_CONGRESO,
  PROVINCIAS_SENADO,
  isPartyEligible
} from '../data/parliamentData';

/**
 * Compact share link: #v1/<c|s>/<seats>/<custom parties>
 * seats: constituencies in list order separated by "-", each "<letter><count>" pairs separated by ".".
 * The letter is the party's position in KNOWN_IDS (a..t), custom parties continue after it.
 */
const KNOWN_IDS = [
  'PP', 'PSOE', 'Vox', 'FA', 'Podemos', 'ERC', 'Junts', 'EH Bildu', 'PNV', 'BNG', 'CC', 'AA',
  'UPN-PP', 'C-FV', 'UPC', 'UPN', 'Compromís', 'AHI', 'ASG', 'Otros', 'SdP'
];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const MAX_CUSTOM = LETTERS.length - KNOWN_IDS.length;

export interface SharedState {
  mode: 'c' | 's';
  scenario: ScenarioData;
  custom: Party[];
}

export function encodeShare(
  mode: 'c' | 's',
  constituencies: Constituency[],
  scenario: ScenarioData,
  custom: Party[]
): string {
  const customUsed = custom.slice(0, MAX_CUSTOM);
  const ids = [...KNOWN_IDS, ...customUsed.map((p) => p.id)];
  const seats = constituencies
    .map((c) => {
      const row = scenario[c.id] || {};
      return Object.entries(row)
        .filter(([id, n]) => n > 0 && ids.includes(id))
        .map(([id, n]) => `${LETTERS[ids.indexOf(id)]}${n}`)
        .join('.');
    })
    .join('-');
  const cp = customUsed
    .map((p) => [p.id, p.fullName || '', p.color].map(encodeURIComponent).join('~'))
    .join(',');
  return `#v1/${mode}/${seats}/${cp}`;
}

export function decodeShare(hash: string): SharedState | null {
  try {
    const m = /^#v1\/([cs])\/([^/]*)\/?(.*)$/.exec(hash);
    if (!m) return null;
    const mode = m[1] as 'c' | 's';
    const constituencies = mode === 'c' ? PROVINCIAS_CONGRESO : PROVINCIAS_SENADO;

    const custom: Party[] = m[3]
      ? m[3]
          .split(',')
          .slice(0, MAX_CUSTOM)
          .map((chunk) => {
            const [id, fullName, color] = chunk.split('~').map(decodeURIComponent);
            return { id, name: id, fullName: fullName || undefined, color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#8a8a80' };
          })
          .filter((p) => p.id)
      : [];
    const ids = [...KNOWN_IDS, ...custom.map((p) => p.id)];
    const valid = new Set((mode === 'c' ? PARTIES_CONGRESO : PARTIES_SENADO).concat(custom).map((p) => p.id));

    const rows = m[2].split('-');
    if (rows.length !== constituencies.length) return null;

    const scenario: ScenarioData = {};
    constituencies.forEach((c, i) => {
      if (!rows[i]) return;
      let used = 0;
      const row: Record<string, number> = {};
      rows[i].split('.').forEach((pair) => {
        const pm = /^([a-z])(\d{1,2})$/.exec(pair);
        if (!pm) return;
        const id = ids[LETTERS.indexOf(pm[1])];
        if (!id || !valid.has(id) || !isPartyEligible(mode === 's', id, c.id)) return;
        const n = Math.min(parseInt(pm[2], 10), c.maxPerParty, c.seats - used);
        if (n > 0) {
          row[id] = n;
          used += n;
        }
      });
      if (used > 0) scenario[c.id] = row;
    });
    return { mode, scenario, custom };
  } catch {
    return null;
  }
}

export function buildTweetText(opts: {
  chamber: string;
  parties: { name: string; count: number }[];
  coalition?: { names: string[]; seats: number; target: number; majorityName: string } | null;
}): string {
  const top = opts.parties
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((p) => `${p.name} ${p.count}`)
    .join(', ');

  let text = `Mi simulación del ${opts.chamber} para el 29-N:\n${top}`;
  if (opts.coalition && opts.coalition.names.length) {
    const c = opts.coalition;
    const diff = c.seats - c.target;
    text += `\n\n${c.names.join(' + ')} suman ${c.seats}`;
    text += diff >= 0 ? ` (${c.majorityName.toLowerCase()})` : ` (faltan ${-diff} para la mayoría)`;
  }
  text += '\n\nPrueba la tuya:';
  return text.length > 255 ? text.slice(0, 252) + '...' : text;
}

export function xIntentUrl(text: string, url: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}
