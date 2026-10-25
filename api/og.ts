import { ImageResponse } from '@vercel/og';
import {
  PARTIES_CONGRESO,
  PARTIES_SENADO,
  PROVINCIAS_CONGRESO,
  PROVINCIAS_SENADO
} from '../src/data/parliamentData';
import { decodeShare } from '../src/utils/share';
import { computeHemicycle, seatOwners } from '../src/utils/hemicycle';

export const config = { runtime: 'edge' };

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]): El => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children }
});

async function loadFont(origin: string, file: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(`${origin}/fonts/${file}`);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function loadCrest(origin: string, mode: 'c' | 's'): Promise<string | null> {
  try {
    const res = await fetch(`${origin}/crest-${mode === 'c' ? 'congreso' : 'senado'}.png`);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:image/png;base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;
  const shared = decodeShare('#' + (url.searchParams.get('d') || ''));
  if (!shared) return new Response('Enlace no válido', { status: 400 });

  const mode = shared.mode;
  const isC = mode === 'c';
  const constituencies = isC ? PROVINCIAS_CONGRESO : PROVINCIAS_SENADO;
  const parties = [...(isC ? PARTIES_CONGRESO : PARTIES_SENADO), ...shared.custom];
  const totalSeats = isC ? 350 : 209;
  const target = isC ? 176 : 133;
  const majorityName = isC ? 'Mayoría absoluta' : 'Mayoría de 3/5';

  const totals: Record<string, number> = {};
  constituencies.forEach((c) => {
    Object.entries(shared.scenario[c.id] || {}).forEach(([id, n]) => {
      totals[id] = (totals[id] || 0) + n;
    });
  });

  const highlight = new Set(
    (url.searchParams.get('k') || '')
      .split(',')
      .filter((id) => parties.some((p) => p.id === id) && (totals[id] || 0) > 0)
  );
  const members = parties.filter((p) => highlight.has(p.id)).sort((a, b) => totals[b.id] - totals[a.id]);
  const coalitionSeats = members.reduce((s, p) => s + totals[p.id], 0);
  const coalitionWins = coalitionSeats >= target;
  const coalitionText = members.length
    ? `${members.map((p) => p.name).join(' + ')} suman ${coalitionSeats}` +
      (coalitionWins ? ` (${majorityName.toLowerCase()})` : ` (faltan ${target - coalitionSeats})`)
    : null;

  // hemicycle
  const layout = computeHemicycle(totalSeats, 300);
  const owners = seatOwners(totalSeats, parties, totals);
  const dim = highlight.size > 0;
  const color = (id: string | null) => parties.find((p) => p.id === id)?.color ?? '#e6e4dc';
  const svgW = 660;
  const svgH = Math.round(((layout.height + 4) * svgW) / layout.width);
  const assigned = owners.filter((o) => o !== null).length;

  const svg = h(
    'svg',
    { width: svgW, height: svgH, viewBox: `0 0 ${layout.width} ${layout.height + 4}` },
    ...layout.seats.map((s, i) =>
      h('circle', {
        cx: s.x,
        cy: s.y,
        r: layout.dot,
        fill: color(owners[i]),
        opacity: dim && !(owners[i] && highlight.has(owners[i] as string)) ? 0.18 : 1
      })
    )
  );

  const rows = parties
    .map((p) => ({ p, n: totals[p.id] || 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 7);

  const [crest, f400, f700, serif] = await Promise.all([
    loadCrest(origin, mode),
    loadFont(origin, 'Inter-400.woff'),
    loadFont(origin, 'Inter-700.woff'),
    loadFont(origin, 'InstrumentSerif-400.woff')
  ]);
  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[] = [];
  if (serif) fonts.push({ name: 'Instrument Serif', data: serif, weight: 400, style: 'normal' });
  if (f400) fonts.push({ name: 'Inter', data: f400, weight: 400, style: 'normal' });
  if (f700) fonts.push({ name: 'Inter', data: f700, weight: 700, style: 'normal' });

  const header = h(
    'div',
    { style: { display: 'flex', alignItems: 'center', padding: '30px 56px 0' } },
    crest ? h('img', { src: crest, height: 84, style: { height: 84, marginRight: 22 } }) : '',
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      h('div', { style: { fontSize: 19, letterSpacing: 2.5, color: '#77756d', fontWeight: 700 } }, 'SIMULADOR 29-N 2026'),
      h(
        'div',
        serif
          ? { style: { fontFamily: 'Instrument Serif', fontSize: 62, fontWeight: 400, color: '#17171a', marginTop: 2, lineHeight: 1.05 } }
          : { style: { fontSize: 44, fontWeight: 700, color: '#17171a', marginTop: 4 } },
        isC ? 'Congreso de los Diputados' : 'Senado de España'
      )
    )
  );

  const left = h(
    'div',
    { style: { display: 'flex', position: 'relative', width: svgW, height: svgH, marginLeft: 6 } },
    svg,
    h(
      'div',
      { style: { position: 'absolute', left: 0, right: 0, bottom: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' } },
      h('div', { style: { fontSize: 64, fontWeight: 700, color: '#17171a', lineHeight: 1 } }, String(assigned)),
      h('div', { style: { fontSize: 18, color: '#77756d', marginTop: 4 } }, `de ${totalSeats} escaños`),
      h('div', { style: { fontSize: 16, color: '#77756d' } }, `${majorityName}: ${target}`)
    )
  );

  const right = h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', flex: 1, marginLeft: 36, marginRight: 56 } },
    ...rows.map(({ p, n }) =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            height: 46,
            opacity: dim && !highlight.has(p.id) ? 0.35 : 1
          }
        },
        h('div', { style: { display: 'flex', width: 20, height: 20, borderRadius: 10, background: p.color, marginRight: 14 } }),
        h('div', { style: { display: 'flex', fontSize: 26, fontWeight: 700, color: '#17171a', flex: 1 } }, p.name),
        h('div', { style: { display: 'flex', fontSize: 28, fontWeight: 700, color: '#17171a' } }, String(n))
      )
    )
  );

  const footer = h(
    'div',
    { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px 26px', height: 74 } },
    coalitionText
      ? h(
          'div',
          {
            style: {
              display: 'flex',
              padding: '10px 22px',
              borderRadius: 999,
              fontSize: 23,
              fontWeight: 700,
              background: coalitionWins ? '#2e8b4f' : '#f0eee8',
              color: coalitionWins ? '#ffffff' : '#17171a'
            }
          },
          coalitionText
        )
      : h('div', { style: { display: 'flex' } }, ' '),
    h('div', { style: { fontSize: 19, color: '#a19e93' } }, origin.replace(/^https?:\/\//, ''))
  );

  const root = h(
    'div',
    {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        fontFamily: fonts.length ? 'Inter' : 'sans-serif'
      }
    },
    h('div', { style: { height: 8, background: '#17171a', display: 'flex' } }),
    header,
    h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', paddingLeft: 40 } }, left, right),
    footer
  );

  return new ImageResponse(root as never, {
    width: 1200,
    height: 630,
    fonts: fonts.length ? fonts : undefined,
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }
  });
}
