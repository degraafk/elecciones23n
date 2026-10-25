import { Party, Constituency, ScenarioData, ALIASES } from '../data/parliamentData';

export function normalizeStr(t: string | number | null | undefined): string {
  return String(t == null ? '' : t)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function tintColor(hex: string, t: number): string {
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  const n = parseInt(cleanHex, 16);
  return (
    '#' +
    [16, 8, 0]
      .map((s) => {
        const c = (n >> s) & 255;
        const blended = Math.round(255 - (255 - c) * t);
        return blended.toString(16).padStart(2, '0');
      })
      .join('')
  );
}

/** Parties tied for the most seats in a province (empty when there is a single leader or no seats). */
export function leadingTie(provSeats: Record<string, number>, parties: Party[]): string[] {
  let max = 0;
  parties.forEach((p) => {
    max = Math.max(max, provSeats[p.id] || 0);
  });
  if (max <= 0) return [];
  const leaders = parties.filter((p) => (provSeats[p.id] || 0) === max).map((p) => p.id);
  return leaders.length > 1 ? leaders : [];
}

/** Every group of parties with the same (non-zero) seats, with the place they share (1 = first). */
export function tieGroups(
  provSeats: Record<string, number>,
  parties: Party[]
): { seats: number; ids: string[]; place: number }[] {
  const withSeats = parties.filter((p) => (provSeats[p.id] || 0) > 0);
  const bySeats = new Map<number, string[]>();
  withSeats.forEach((p) => {
    const n = provSeats[p.id];
    bySeats.set(n, [...(bySeats.get(n) || []), p.id]);
  });
  return [...bySeats.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort((a, b) => b[0] - a[0])
    .map(([seats, ids]) => ({
      seats,
      ids,
      place: 1 + withSeats.filter((p) => provSeats[p.id] > seats).length
    }));
}

export function getProvinceFill(
  provinceId: string,
  modeKey: 'c' | 's',
  scenario: ScenarioData,
  parties: Party[],
  svgDefs: Set<string>,
  tieOrder?: string[]
): { fill: string; patternId?: string; patternDef?: { id: string; colors: string[] } } {
  const provSeats = scenario[provinceId] || {};
  const partyEntries: { partyIndex: number; seats: number }[] = [];

  parties.forEach((p, i) => {
    const s = provSeats[p.id] || 0;
    if (s > 0) {
      partyEntries.push({ partyIndex: i, seats: s });
    }
  });

  if (partyEntries.length === 0) {
    return { fill: '#ece8df' };
  }

  partyEntries.sort((a, b) => b.seats - a.seats || a.partyIndex - b.partyIndex);
  const maxSeats = partyEntries[0].seats;
  const winners = partyEntries.filter((e) => e.seats === maxSeats).map((e) => e.partyIndex);

  if (winners.length === 1) {
    const party = parties[winners[0]];
    return { fill: tintColor(party.color, 0.3) };
  }

  // Tie that the user has ordered: only the first party's colour is shown
  if (tieOrder) {
    const ids = winners.map((idx) => parties[idx].id);
    if (ids.every((id) => tieOrder.includes(id))) {
      const first = [...ids].sort((a, b) => tieOrder.indexOf(a) - tieOrder.indexOf(b))[0];
      const party = parties.find((p) => p.id === first)!;
      return { fill: tintColor(party.color, 0.3) };
    }
  }

  // Hatch pattern for unresolved ties
  const patternId = `h${modeKey}-${winners.join('-')}`;
  const patternColors = winners.map((idx) => tintColor(parties[idx].color, 0.3));

  return {
    fill: `url(#${patternId})`,
    patternId,
    patternDef: { id: patternId, colors: patternColors }
  };
}

export function downloadFile(name: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv(
  filename: string,
  constituencies: Constituency[],
  parties: Party[],
  scenario: ScenarioData,
  isSenado: boolean
) {
  const escapeCell = (val: string | number) => {
    const s = String(val);
    if (/[",;\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = [
    isSenado ? 'Circunscripción' : 'Provincia',
    'Escaños',
    ...(isSenado ? ['Máx. por partido'] : []),
    ...parties.map((p) => p.name)
  ];

  const rows = [header.map(escapeCell).join(',')];

  constituencies.forEach((c) => {
    const row = [
      c.name,
      c.seats,
      ...(isSenado ? [c.maxPerParty] : []),
      ...parties.map((p) => scenario[c.id]?.[p.id] || 0)
    ];
    rows.push(row.map(escapeCell).join(','));
  });

  const csvString = '\ufeff' + rows.join('\r\n');
  downloadFile(`${filename}_escanos.csv`, csvString, 'text/csv;charset=utf-8');
}

/** Minimal CSV reader: quoted fields, "" escapes, CRLF/LF, and , ; or tab as separator. */
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\ufeff/, '');
  const firstLines = clean.split(/\r?\n/).filter((l) => l.trim() !== '').slice(0, 5);
  const count = (d: string) => firstLines.reduce((n, l) => n + l.split(d).length - 1, 0);
  const delim = [',', ';', '\t'].reduce((best, d) => (count(d) > count(best) ? d : best), ',');

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function readCsvText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf); // CSVs saved by older Excel versions
  }
}

export async function parseSpreadsheetFile(
  file: File,
  constituencies: Constituency[],
  parties: Party[]
): Promise<{ newScenario: ScenarioData; rowCount: number; warnings: string[] }> {
  const rows: (string | number)[][] = parseCsv(await readCsvText(file));

  // Build name to id lookup
  const provMap: Record<string, string> = {};
  constituencies.forEach((c) => {
    provMap[normalizeStr(c.name)] = c.id;
  });
  Object.keys(ALIASES).forEach((alias) => {
    const target = constituencies.find((c) => normalizeStr(c.name) === ALIASES[alias]);
    if (target) {
      provMap[alias] = target.id;
    }
  });

  // Build party map
  const partyMap: Record<string, string> = {};
  parties.forEach((p) => {
    partyMap[normalizeStr(p.name)] = p.id;
    if (p.fullName) {
      partyMap[normalizeStr(p.fullName)] = p.id;
    }
  });
  partyMap['eajpnv'] = 'PNV';
  partyMap['bildu'] = 'EH Bildu';
  partyMap['cc'] = 'CC';

  // Find header row with party names
  const headerIdx = rows.findIndex((row) =>
    row.some((cell) => partyMap[normalizeStr(String(cell))])
  );

  if (headerIdx < 0) {
    throw new Error('No se encontró la fila con los nombres de los partidos.');
  }

  const headerRow = rows[headerIdx];
  const partyCols: Record<number, string> = {};
  headerRow.forEach((cell, colIdx) => {
    const match = partyMap[normalizeStr(String(cell))];
    if (match) {
      partyCols[colIdx] = match;
    }
  });

  const newScenario: ScenarioData = {};
  let count = 0;
  const badNames: string[] = [];
  let trimmedRows = 0;

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const provNameRaw = String(row[0] || '').trim();
    if (!provNameRaw || normalizeStr(provNameRaw) === 'total') continue;

    const provId = provMap[normalizeStr(provNameRaw)];
    if (!provId) {
      badNames.push(provNameRaw);
      continue;
    }

    const constObj = constituencies.find((c) => c.id === provId);
    if (!constObj) continue;

    const seatsObj: Record<string, number> = {};
    let totalAssigned = 0;

    Object.entries(partyCols).forEach(([colStr, partyId]) => {
      const colIdx = Number(colStr);
      const val = parseInt(String(row[colIdx]), 10) || 0;
      if (val > 0) {
        seatsObj[partyId] = Math.min(val, constObj.maxPerParty);
        totalAssigned += seatsObj[partyId];
      }
    });

    if (totalAssigned > constObj.seats) {
      trimmedRows++;
      // Scale or cap down proportionally
      let running = 0;
      Object.keys(seatsObj).forEach((pId) => {
        const allowed = Math.max(0, constObj.seats - running);
        seatsObj[pId] = Math.min(seatsObj[pId], allowed);
        running += seatsObj[pId];
      });
    }

    newScenario[provId] = seatsObj;
    count++;
  }

  const warnings: string[] = [];
  if (badNames.length) {
    warnings.push(`Filas no reconocidas: ${badNames.slice(0, 5).join(', ')}`);
  }
  if (trimmedRows > 0) {
    warnings.push(`${trimmedRows} circunscripciones superaban el límite y se recortaron.`);
  }

  return { newScenario, rowCount: count, warnings };
}
