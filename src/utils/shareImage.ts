import { Party } from '../data/parliamentData';
import { computeHemicycle, seatOwners } from './hemicycle';
import { MAP_VIEW } from '../data/mapView';

export const CARD_W = 1600;
export const CARD_H = 1150;
const SCALE = 1.5; // PNG is rendered at 1.5x (2400 x 1725) so it stays sharp when zoomed or printed

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

const TITLE_FONT = "'Instrument Serif', Georgia, 'Times New Roman', serif";
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
  ctx.textBaseline = 'alphabetic';

  // soft rounded frame
  const fi = 28;
  const fr = 56;
  ctx.strokeStyle = '#dedcd5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fi + fr, fi);
  ctx.arcTo(W - fi, fi, W - fi, H - fi, fr);
  ctx.arcTo(W - fi, H - fi, fi, H - fi, fr);
  ctx.arcTo(fi, H - fi, fi, fi, fr);
  ctx.arcTo(fi, fi, W - fi, fi, fr);
  ctx.closePath();
  ctx.stroke();

  // header: crest, chamber, title
  let tx = 100;
  if (d.crest) {
    const img = d.crest as HTMLImageElement;
    const ch = 112;
    const cw = img.width && img.height ? (ch * img.width) / img.height : 64;
    ctx.drawImage(d.crest, 100, 72, cw, ch);
    tx = 100 + cw + 30;
  }
  ctx.fillStyle = '#77756d';
  ctx.font = `700 25px ${FONT}`;
  ctx.fillText(d.label.toUpperCase(), tx, 102);
  ctx.fillStyle = '#17171a';
  ctx.font = `400 78px ${TITLE_FONT}`;
  ctx.fillText(d.title, tx, 186);
  const titleEnd = tx + ctx.measureText(d.title).width;

  // selected coalition, top right
  if (d.coalitionText) {
    const room = W - 100 - titleEnd - 40;
    let px = 27;
    ctx.font = `700 ${px}px ${FONT}`;
    while (px > 19 && ctx.measureText(d.coalitionText).width > room - 48) {
      px -= 1;
      ctx.font = `700 ${px}px ${FONT}`;
    }
    const text = fit(ctx, d.coalitionText, Math.max(240, room - 48));
    const w = ctx.measureText(text).width + 48;
    const x = W - 100 - w;
    ctx.fillStyle = d.coalitionWins ? '#2e8b4f' : '#f0eee8';
    pill(ctx, x, 84, w, 56);
    ctx.fill();
    ctx.fillStyle = d.coalitionWins ? '#ffffff' : '#17171a';
    ctx.fillText(text, x + 24, 84 + 56 / 2 + px * 0.35);
  }

  // map, large on the left (the Canary Islands sit inside it, lower right)
  const mapX = 60;
  const mapY = 235;
  const mapW = 980;
  const mapH = (mapW * MAP_VIEW.h) / MAP_VIEW.w;
  if (d.map) ctx.drawImage(d.map, mapX, mapY, mapW, mapH);

  const dim = d.highlight.size > 0;

  // right column: hemicycle on top (no text inside), then every party with seats in regular weight
  const colX = 1080;
  const colW = 450;
  const layout = computeHemicycle(d.totalSeats, 300);
  const sc = colW / layout.width;
  const hy = 205;
  const owners = seatOwners(d.totalSeats, d.parties, d.partyTotals);
  const colorOf = (id: string | null) => d.parties.find((p) => p.id === id)?.color ?? '#e6e4dc';
  layout.seats.forEach((s, i) => {
    const owner = owners[i];
    ctx.globalAlpha = dim && !(owner && d.highlight.has(owner)) ? 0.2 : 1;
    ctx.fillStyle = colorOf(owner);
    ctx.beginPath();
    ctx.arc(colX + s.x * sc, hy + s.y * sc, layout.dot * sc, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const rows = d.parties
    .map((p) => ({ p, n: d.partyTotals[p.id] || 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);
  const listTop = hy + layout.height * sc + 56;
  const listBottom = mapY + mapH;
  const rowH = Math.min(46, (listBottom - listTop) / Math.max(rows.length, 1));
  const fs = Math.min(29, rowH * 0.64);
  let ly = listTop + fs;
  rows.forEach(({ p, n }) => {
    ctx.globalAlpha = dim && !d.highlight.has(p.id) ? 0.35 : 1;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(colX + fs * 0.45, ly - fs * 0.34, fs * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#17171a';
    ctx.font = `400 ${fs}px ${FONT}`;
    ctx.fillText(fit(ctx, p.name, colW - 110), colX + fs * 1.35, ly);
    ctx.textAlign = 'right';
    ctx.fillText(String(n), colX + colW, ly);
    ctx.textAlign = 'left';
    ly += rowH;
  });
  ctx.globalAlpha = 1;

  // footer: just the site name
  if (d.host) {
    ctx.fillStyle = '#a19e93';
    ctx.font = `500 20px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(d.host, W - 100, H - 58);
    ctx.textAlign = 'left';
  }
}

/** Standalone copy of the on-screen map: full view (never the zoomed one), no hover outline. */
export function serializeMapSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `${MAP_VIEW.x} ${MAP_VIEW.y} ${MAP_VIEW.w} ${MAP_VIEW.h}`);
  clone.setAttribute('width', String(MAP_VIEW.w * 2));
  clone.setAttribute('height', String(MAP_VIEW.h * 2));
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  clone.setAttribute('font-family', "Inter, 'Segoe UI', system-ui, Helvetica, Arial, sans-serif");
  clone.querySelector('#mapa-hover-overlay')?.remove();
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

/** Renders the prediction card as a sharp PNG (2400 x 1725). */
export async function makeShareImage(
  data: Omit<ShareCardData, 'crest' | 'map' | 'host'> & { crestSrc: string; mapSvg: string | null; url: string }
): Promise<Blob> {
  const { crestSrc, mapSvg, url, ...rest } = data;
  try {
    await document.fonts.load('78px "Instrument Serif"'); // make sure the title font is ready before drawing
  } catch {
    /* falls back to Georgia */
  }
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
