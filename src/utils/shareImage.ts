import { Party } from '../data/parliamentData';
import { computeHemicycle, seatOwners } from './hemicycle';

export interface ShareCardData {
  title: string; // "Congreso de los Diputados"
  label: string; // "Simulador 29-N 2026"
  crest: CanvasImageSource | null;
  parties: Party[];
  partyTotals: Record<string, number>;
  totalSeats: number;
  targetSeats: number;
  majorityName: string;
  highlight: Set<string>; // selected coalition (empty = none)
  coalitionText: string | null;
  coalitionWins: boolean;
  url: string;
}

const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif";

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '...').width > maxW) t = t.slice(0, -1);
  return t + '...';
}

export function renderShareCard(ctx: CanvasRenderingContext2D, W: number, H: number, d: ShareCardData) {
  // background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fafaf8';
  ctx.fillRect(0, 0, W, 8);
  ctx.fillStyle = '#17171a';
  ctx.fillRect(0, 0, W, 8);

  // header
  let tx = 56;
  if (d.crest) {
    const ch = 92;
    const cw = (d.crest as HTMLImageElement).width
      ? (ch * (d.crest as HTMLImageElement).width) / (d.crest as HTMLImageElement).height
      : 56;
    ctx.drawImage(d.crest, 56, 38, cw, ch);
    tx = 56 + cw + 24;
  }
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#77756d';
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText(d.label.toUpperCase(), tx, 70);
  ctx.fillStyle = '#17171a';
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText(fit(ctx, d.title, W - tx - 56), tx, 120);

  // hemicycle
  const layout = computeHemicycle(d.totalSeats, 300);
  const scale = 720 / layout.width;
  const ox = 40;
  const oy = 190;
  const owners = seatOwners(d.totalSeats, d.parties, d.partyTotals);
  const colorOf = (id: string | null) => d.parties.find((p) => p.id === id)?.color ?? '#e6e4dc';
  const dim = d.highlight.size > 0;

  layout.seats.forEach((s, i) => {
    const owner = owners[i];
    ctx.globalAlpha = dim && !(owner && d.highlight.has(owner)) ? 0.2 : 1;
    ctx.fillStyle = colorOf(owner);
    ctx.beginPath();
    ctx.arc(ox + s.x * scale, oy + s.y * scale, layout.dot * scale, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // number in the middle
  const assigned = owners.filter((o) => o !== null).length;
  const mx = ox + layout.cx * scale;
  const my = oy + layout.cy * scale;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#17171a';
  ctx.font = `700 68px ${FONT}`;
  ctx.fillText(String(assigned), mx, my - 40);
  ctx.fillStyle = '#77756d';
  ctx.font = `500 20px ${FONT}`;
  ctx.fillText(`de ${d.totalSeats} escaños`, mx, my - 10);
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText(`${d.majorityName}: ${d.targetSeats}`, mx, my + 18);
  ctx.textAlign = 'left';

  // party list
  const rows = d.parties
    .map((p) => ({ p, n: d.partyTotals[p.id] || 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  const lx = 810;
  let ly = 205;
  rows.forEach(({ p, n }) => {
    ctx.globalAlpha = dim && !d.highlight.has(p.id) ? 0.35 : 1;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(lx + 12, ly - 9, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#17171a';
    ctx.font = `600 27px ${FONT}`;
    ctx.fillText(fit(ctx, p.name, 190), lx + 36, ly);
    ctx.textAlign = 'right';
    ctx.font = `700 29px ${FONT}`;
    ctx.fillText(String(n), lx + 330, ly);
    ctx.textAlign = 'left';
    ly += 47;
  });
  ctx.globalAlpha = 1;

  // coalition pill
  if (d.coalitionText) {
    ctx.font = `600 24px ${FONT}`;
    const text = fit(ctx, d.coalitionText, W - 56 * 2 - 40);
    const w = ctx.measureText(text).width + 40;
    const x = 56;
    const y = 590;
    ctx.fillStyle = d.coalitionWins ? '#2e8b4f' : '#f0eee8';
    ctx.beginPath();
    const r = 24;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + 48, r);
    ctx.arcTo(x + w, y + 48, x, y + 48, r);
    ctx.arcTo(x, y + 48, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = d.coalitionWins ? '#ffffff' : '#17171a';
    ctx.fillText(text, x + 20, y + 32);
  }

  // footer
  ctx.fillStyle = '#a19e93';
  ctx.font = `500 20px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(d.url.replace(/^https?:\/\//, '').replace(/#.*$/, '').replace(/\/$/, ''), W - 56, H - 26);
  ctx.textAlign = 'left';
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Renders the 1200x675 share card (the ratio X shows without cropping) as a PNG. */
export async function makeShareImage(data: Omit<ShareCardData, 'crest'> & { crestSrc: string }): Promise<Blob> {
  const crest = await loadImage(data.crestSrc);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  renderShareCard(ctx, 1200, 675, { ...data, crest });
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/png');
  });
}
