import { SITE, WHATSAPP, TIPOS, MATERIALES, MARCAS, GENEROS, urlFoto, datosPublicos } from '../lib/util.mjs';

/** /productos.json: listado público en JSON limpio, pensado para buscadores y asistentes de IA (GEO/AEO). */
export default async () => {
  let productos = []; try { productos = (await datosPublicos()).productos; } catch { /* sin datos todavía */ }
  const items = productos.map((p) => {
    const qs = p.tipo === 'relojes' ? `tipo=relojes${p.marca ? '&marca=' + p.marca : ''}` : `tipo=${p.tipo}&material=${p.material}`;
    return {
      id: p.id, nombre: p.nombre, categoria: TIPOS[p.tipo] || p.tipo, material: MATERIALES[p.material] || null,
      genero: GENEROS[p.genero] || null, marca: MARCAS[p.marca] || null, descripcion: p.desc || '',
      precio: p.precio || null, moneda: p.precio ? 'ARS' : null, precio_anterior: p.precioAnterior || null,
      fotos: p.imgs.map((k) => urlFoto(k)), url: `${SITE}/catalogo?${qs}`, publicado: p.fecha,
    };
  });
  return new Response(JSON.stringify({
    comercio: 'Alteza Joyería y Relojería', sitio: SITE, ubicacion: 'San Martín 854, Presidencia Roque Sáenz Peña, Chaco, Argentina',
    whatsapp: `https://wa.me/${WHATSAPP}`, total: items.length, productos: items,
  }, null, 1), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
  });
};

export const config = { path: '/productos.json' };
