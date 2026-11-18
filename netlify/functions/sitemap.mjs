import { SITE, TIPOS, datosPublicos } from '../lib/util.mjs';

/** /sitemap.xml: páginas fijas + una URL por cada categoría que realmente tiene productos (se actualiza sola). */
export default async () => {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  let productos = []; try { productos = (await datosPublicos()).productos; } catch { /* sin datos todavía */ }

  const ultima = productos.map((p) => p.fecha).filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f)).sort().pop() || '';
  const urls = [['/', 'weekly', '1.0', ultima], ['/catalogo', 'daily', '0.9', ultima], ['/nosotros', 'monthly', '0.5', '']];

  const vistas = new Set();
  const agregar = (qs, fecha) => { if (!vistas.has(qs)) { vistas.add(qs); urls.push(['/catalogo?' + qs, 'weekly', '0.7', fecha]); } };
  for (const p of productos) {
    if (!TIPOS[p.tipo]) continue;
    if (p.tipo === 'relojes') { agregar('tipo=relojes', p.fecha); if (p.marca) agregar('tipo=relojes&marca=' + p.marca, p.fecha); }
    else if (p.material) agregar(`tipo=${p.tipo}&material=${p.material}`, p.fecha);
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(([loc, freq, prio, mod]) =>
      `  <url><loc>${esc(SITE + loc)}</loc>${/^\d{4}-\d{2}-\d{2}$/.test(mod) ? `<lastmod>${mod}</lastmod>` : ''}<changefreq>${freq}</changefreq><priority>${prio}</priority></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });
};

export const config = { path: '/sitemap.xml' };
