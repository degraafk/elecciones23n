import { Party } from '../data/parliamentData';
import { computeHemicycle, seatOwners } from './hemicycle';

export const CARD_W = 1600;
export const CARD_H = 1600; // square
const SCALE = 1.5; // PNG is rendered at 1.5x (2400 x 2400) so it stays sharp when zoomed or printed

export interface ShareCardData {
  title: string;
  label: string;
  crest: CanvasImageSource | null;
  map: CanvasImageSource | null; // the map as currently shown (seats, colours, coalition dimming)
  parties: Party[];
  partyTotals: Record<string, number>;
  totalSeats: number;
  targetSeats: number;
  majorityName: string;
  highlight: Set<string>; // selected coalition (empty = none)
  coalitionText: string | null;
  coalitionWins: boolean;
  host: string;
}

const FONT = "Inter, 'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif";

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '...').width > maxW) t = t.slice(0, -1);
  return t + '...';
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderShareCard(ctx: CanvasRenderingContext2D, W: number, H: number, d: ShareCardData) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#17171a';
  ctx.fillRect(0, 0, W, 10);
  ctx.textBaseline = 'alphabetic';

  // header
  let tx = 64;
  if (d.crest) {
    const img = d.crest as HTMLImageElement;
    const ch = 104;
    const cw = img.width && img.height ? (ch * img.width) / img.height : 60;
    ctx.drawImage(d.crest, 64, 40, cw, ch);
    tx = 64 + cw + 28;
  }
  ctx.fillStyle = '#77756d';
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText(d.label.toUpperCase(), tx, 80);
  ctx.fillStyle = '#17171a';
  ctx.font = `700 56px ${FONT}`;
  ctx.fillText(d.title, tx, 140);
  const titleEnd = tx + ctx.measureText(d.title).width;

  // coalition pill, top right
  if (d.coalitionText) {
    ctx.font = `700 27px ${FONT}`;
    const maxW = Math.max(300, W - 64 - titleEnd - 48);
    const text = fit(ctx, d.coalitionText, maxW - 48);
    const w = ctx.measureText(text).width + 48;
    const x = W - 64 - w;
    ctx.fillStyle = d.coalitionWins ? '#2e8b4f' : '#f0eee8';
    pill(ctx, x, 62, w, 56);
    ctx.fill();
    ctx.fillStyle = d.coalitionWins ? '#ffffff' : '#17171a';
    ctx.fillText(text, x + 24, 100);
  }

  // map, large on the left
  const mapW = 900;
  const mapH = (mapW * 790) / 870;
  if (d.map) ctx.drawImage(d.map, 40, 165, mapW, mapH);

  const dim = d.highlight.size > 0;

  // every party with seats, regular weight, filling the column next to the map
  const rows = d.parties
    .map((p) => ({ p, n: d.partyTotals[p.id] || 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);
  const listX = 1010;
  const listW = 530;
  const rowH = Math.min(54, 790 / Math.max(rows.length, 1));
  const fs = Math.min(32, rowH * 0.64);
  let ly = 215 + rowH * 0.7;
  rows.forEach(({ p, n }) => {
    ctx.globalAlpha = dim && !d.highlight.has(p.id) ? 0.35 : 1;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(listX + fs * 0.5, ly - fs * 0.34, fs * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#17171a';
    ctx.font = `400 ${fs}px ${FONT}`;
    ctx.fillText(fit(ctx, p.name, listW - 140), listX + fs * 1.4, ly);
    ctx.textAlign = 'right';
    ctx.fillText(String(n), listX + listW, ly);
    ctx.textAlign = 'left';
    ly += rowH;
  });
  ctx.globalAlpha = 1;

  // hemicycle, large across the bottom (no text inside)
  const hw = 1060;
  const layout = computeHemicycle(d.totalSeats, 300);
  const sc = hw / layout.width;
  const hx = (W - hw) / 2;
  const hy = 1010;
  const owners = seatOwners(d.totalSeats, d.parties, d.partyTotals);
  const colorOf = (id: string | null) => d.parties.find((p) => p.id === id)?.color ?? '#e6e4dc';
  layout.seats.forEach((s, i) => {
    const owner = owners[i];
    ctx.globalAlpha = dim && !(owner && d.highlight.has(owner)) ? 0.2 : 1;
    ctx.fillStyle = colorOf(owner);
    ctx.beginPath();
    ctx.arc(hx + s.x * sc, hy + s.y * sc, layout.dot * sc, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // footer: just the site name
  if (d.host) {
    ctx.fillStyle = '#a19e93';
    ctx.font = `500 21px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(d.host, W - 64, H - 22);
    ctx.textAlign = 'left';
  }
}

/** Standalone copy of the on-screen map: full view (never the zoomed one), no hover outline. */
export function serializeMapSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', '30 90 870 790');
  clone.setAttribute('width', '1740');
  clone.setAttribute('height', '1580');
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  clone.setAttribute('font-family', "Inter, 'Segoe UI', system-ui, Helvetica, Arial, sans-serif");
  clone.querySelector('#mapa-hover-overlay')?.remove();
  // labels such as "Madrid (38)" lose their seat count in the image
  clone.querySelectorAll('text').forEach((t) => {
    t.textContent = (t.textContent || '').replace(/\s*\(\d+\)\s*$/, '');
  });
  return new XMLSerializer().serializeToString(clone);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Renders the prediction card as a sharp PNG (3200 x 1920). */
export async function makeShareImage(
  data: Omit<ShareCardData, 'crest' | 'map' | 'host'> & { crestSrc: string; mapSvg: string | null; url: string }
): Promise<Blob> {
  const { crestSrc, mapSvg, url, ...rest } = data;
  const [crest, mapUrl] = [await loadImage(crestSrc), mapSvg ? URL.createObjectURL(new Blob([mapSvg], { type: 'image/svg+xml;charset=utf-8' })) : null];
  const map = mapUrl ? await loadImage(mapUrl) : null;

  let host = '';
  try {
    host = new URL(url).host;
  } catch {
    host = '';
  }

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W * SCALE;
  canvas.height = CARD_H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingQuality = 'high';
  renderShareCard(ctx, CARD_W, CARD_H, { ...rest, crest, map, host });
  if (mapUrl) URL.revokeObjectURL(mapUrl);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/png');
  });
}
