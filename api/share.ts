import { PARTIES_CONGRESO, PARTIES_SENADO, PROVINCIAS_CONGRESO, PROVINCIAS_SENADO } from '../src/data/parliamentData';
import { decodeShare } from '../src/utils/share';

export const config = { runtime: 'edge' };

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Landing page for shared links: gives X (and any other crawler) the preview image
 * for this exact scenario, then sends people to the app with the scenario loaded.
 */
export default function handler(request: Request): Response {
  const url = new URL(request.url);
  const d = url.searchParams.get('d') || '';
  const k = url.searchParams.get('k') || '';
  const shared = decodeShare('#' + d);
  if (!shared) return Response.redirect(url.origin + '/', 302);

  const isC = shared.mode === 'c';
  const constituencies = isC ? PROVINCIAS_CONGRESO : PROVINCIAS_SENADO;
  const parties = [...(isC ? PARTIES_CONGRESO : PARTIES_SENADO), ...shared.custom];
  const totals: Record<string, number> = {};
  constituencies.forEach((c) => {
    Object.entries(shared.scenario[c.id] || {}).forEach(([id, n]) => {
      totals[id] = (totals[id] || 0) + n;
    });
  });

  const top = parties
    .filter((p) => (totals[p.id] || 0) > 0)
    .sort((a, b) => totals[b.id] - totals[a.id])
    .slice(0, 6)
    .map((p) => `${p.name} ${totals[p.id]}`)
    .join(', ');

  const chamber = isC ? 'Congreso' : 'Senado';
  const title = `Mi simulación del ${chamber} para el 29-N`;
  const description = top ? `${top}. Abre el enlace y prueba la tuya.` : 'Abre el enlace y prueba la tuya.';
  const image = `${url.origin}/api/og?d=${encodeURIComponent(d)}${k ? `&k=${encodeURIComponent(k)}` : ''}`;
  const target = `${url.origin}/#${d}`;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<meta http-equiv="refresh" content="0;url=${esc(target)}" />
</head>
<body>
<script>location.replace(${JSON.stringify(target)});</script>
<p><a href="${esc(target)}">Abrir el simulador</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' }
  });
}
