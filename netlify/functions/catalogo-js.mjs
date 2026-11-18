import { datosPublicos, TAG_CACHE } from '../lib/util.mjs';

/**
 * /api/catalogo.js  ->  window.ALTEZA = { productos: [...], anuncios: [...] }
 * Lo usan la home y el catálogo como un <script> común (sin fetch asíncrono).
 * Se cachea en el CDN y se refresca al instante cada vez que el panel guarda (purgeCache por etiqueta);
 * si el purgado fallara, el límite de seguridad es s-maxage=120 (dos minutos).
 */
export default async () => {
  const headers = {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Netlify-CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
    'Netlify-Cache-Tag': TAG_CACHE,
  };
  try {
    const datos = await datosPublicos();
    return new Response('window.ALTEZA=' + JSON.stringify(datos).replace(/</g, '\\u003c') + ';', { headers });
  } catch (e) {
    console.error(e);
    // Si falla, el sitio sigue funcionando (sin productos) y el error NO se guarda en caché
    return new Response('window.ALTEZA={productos:[],anuncios:[],error:true};', {
      headers: { ...headers, 'Cache-Control': 'no-store', 'Netlify-CDN-Cache-Control': 'no-store' },
    });
  }
};

export const config = { path: '/api/catalogo.js' };
