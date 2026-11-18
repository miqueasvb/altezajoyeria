/**
 * Utilidades compartidas por todas las functions de Alteza Joyería.
 * - Datos: un único store de Netlify Blobs ("alteza") con la clave "catalogo" (productos + anuncios),
 *   las fotos ("img:<clave>" y "thumb:<clave>") y la contraseña del panel ("auth").
 * - Sesión: cookie firmada con HMAC (SESSION_SECRET), HttpOnly + Secure + SameSite=Strict.
 */
import { getStore } from '@netlify/blobs';
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const SITE = 'https://altezajoyeria.com.ar';
export const WHATSAPP = '5493644305999';
export const TAG_CACHE = 'alteza-catalogo';
export const DURACION_SESION = 30 * 24 * 3600 * 1000; // 30 días
export const MAX_FOTOS = 4;
export const MAX_DESTACADOS = 6;
export const MAX_ANUNCIOS = 6;

/* ------------------------------------------------------------------ */
/* Taxonomía: ÚNICA fuente de verdad. El panel la pide al servidor.    */
/* Si agregás una marca o categoría nueva, también hay que agregar su  */
/* filtro en catalogo.html (sidebar) y en js/alteza-app.js (etiquetas) */
/* ------------------------------------------------------------------ */
export const TIPOS = {
  anillos: 'Anillos', aros: 'Aros', cadenas: 'Cadenas', pulseras: 'Pulseras',
  dijes: 'Dijes y colgantes', cintillos: 'Cintillos', alianzas: 'Alianzas', relojes: 'Relojería',
};
export const MATERIALES = { oro: 'Oro 18k', plata: 'Plata 925', 'plata-oro': 'Plata y oro' };
// Materiales con los que el filtro del catálogo sabe mostrar cada tipo (relojes no lleva material)
export const COMBOS = {
  anillos: ['oro', 'plata'], aros: ['oro', 'plata'], cadenas: ['oro', 'plata'], pulseras: ['oro', 'plata'],
  dijes: ['oro', 'plata'], cintillos: ['oro', 'plata'], alianzas: ['oro', 'plata', 'plata-oro'], relojes: [],
};
export const GENEROS = { dama: 'Dama', caballero: 'Caballero' };
export const SUBS = {
  anillos: { 'con-piedras': 'Con piedras', 'sin-piedras': 'Sin piedras' },
  aros: { abridores: 'Abridores', argollas: 'Argollas', 'cierre-rosca': 'Cierre rosca' },
  pulseras: { 'con-piedras': 'Con piedras', esclavas: 'Esclavas' },
};
export const MARCAS = {
  citizen: 'Citizen', casio: 'Casio', festina: 'Festina', swatch: 'Swatch', tissot: 'Tissot', seiko: 'Seiko',
  cat: 'Cat', orient: 'Orient', 'tommy-hilfiger': 'Tommy Hilfiger', tressa: 'Tressa', election: 'Election',
  lacoste: 'Lacoste', 'calvin-klein': 'Calvin Klein', 'knock-out': 'Knock Out',
};
export const TAXONOMIA = { tipos: TIPOS, materiales: MATERIALES, combos: COMBOS, generos: GENEROS, subs: SUBS, marcas: MARCAS };

// Mensajes de la barra superior mientras el dueño no los cambie (solo datos reales del local)
export const ANUNCIOS_DEFAULT = [
  'Joyería y relojería en Sáenz Peña, Chaco',
  'Lunes a sábado de 9 a 12:30 y de 17 a 21 hs',
  'Consultas y pedidos por WhatsApp',
];

/* ------------------------------------------------------------------ */
/* Respuestas y errores                                                */
/* ------------------------------------------------------------------ */
export class Pub extends Error {            // error con mensaje seguro para mostrar al usuario
  constructor(msg, status = 400) { super(msg); this.publico = true; this.status = status; }
}
export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
});

/* ------------------------------------------------------------------ */
/* Almacenamiento                                                      */
/* ------------------------------------------------------------------ */
let storePrueba = null;
export const usarStore = (s) => { storePrueba = s; };   // solo para tests
export const store = () => storePrueba || getStore({ name: 'alteza', consistency: 'strong' });

export async function purgar() {            // refresca el caché del CDN para que el cambio se vea al instante
  if (process.env.NODE_ENV === 'test') return;
  try { const { purgeCache } = await import('@netlify/cache'); await purgeCache({ tags: [TAG_CACHE] }); }
  catch (e) { console.warn('No se pudo purgar el caché (el cambio se verá en un par de minutos):', e?.message); }
}

export async function leer(st) {
  const d = await st.get('catalogo', { type: 'json' });
  return { nextId: d?.nextId || 1, items: Array.isArray(d?.items) ? d.items : [], anuncios: Array.isArray(d?.anuncios) ? d.anuncios : null };
}
export async function guardar(st, d) { await st.setJSON('catalogo', d); await purgar(); }

export const keyValida = (k) => typeof k === 'string' && /^[a-z0-9-]{2,60}$/.test(k);
export async function borrarImgs(st, keys = []) {
  for (const k of keys) if (keyValida(k)) { await st.delete('img:' + k); await st.delete('thumb:' + k); }
}

/* ------------------------------------------------------------------ */
/* Texto y números                                                     */
/* ------------------------------------------------------------------ */
export const str = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u2028\u2029]/g, '').trim().slice(0, max);
const entero = (v) => { const n = parseInt(String(v ?? '').replace(/\D/g, ''), 10); return Number.isFinite(n) ? Math.min(n, 999_999_999) : 0; };
export const hoy = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });

/** Valida y normaliza un producto que llega del panel. Lanza Pub con un mensaje claro si algo falta. */
export function limpiar(b = {}) {
  const tipo = TIPOS[b.tipo] ? b.tipo : '';
  if (!tipo) throw new Pub('Elegí la categoría del producto');
  const nombre = str(b.nombre, 120).replace(/\s+/g, ' ');
  if (!nombre) throw new Pub('Escribí el nombre del producto');

  let material = '', marca = '';
  if (tipo === 'relojes') marca = MARCAS[b.marca] ? b.marca : '';
  else {
    material = COMBOS[tipo].includes(b.material) ? b.material : '';
    if (!material) throw new Pub('Elegí el material');
  }
  const genero = GENEROS[b.genero] ? b.genero : '';
  const sub = SUBS[tipo]?.[b.sub] ? b.sub : '';

  const imgs = [...new Set((Array.isArray(b.imgs) ? b.imgs : []).filter(keyValida))].slice(0, MAX_FOTOS);
  if (!imgs.length) throw new Pub('Agregá al menos una foto');

  const precio = entero(b.precio);
  let precioAnterior = precio ? entero(b.precioAnterior) : 0;
  if (precioAnterior && precioAnterior <= precio) precioAnterior = 0;     // solo es "oferta" si el anterior es mayor

  return {
    nombre, tipo, material, genero, sub, marca, precio, precioAnterior,
    desc: str(b.desc, 1000), imgs, destacado: !!b.destacado, activo: b.activo !== false,
  };
}

export function limpiarAnuncios(lista) {
  return (Array.isArray(lista) ? lista : []).map((t) => str(t, 110).replace(/\s+/g, ' ')).filter(Boolean).slice(0, MAX_ANUNCIOS);
}

/* ------------------------------------------------------------------ */
/* Datos públicos (lo que ve cualquier visitante)                      */
/* ------------------------------------------------------------------ */
export const urlFoto = (k, mini = false) => `${SITE}/media/${k}${mini ? '-m' : ''}.jpg`;

export function publicos(d) {
  const productos = d.items
    .filter((p) => p.activo !== false)
    .map(({ id, nombre, tipo, material, genero, sub, marca, precio, precioAnterior, desc, imgs, destacado, fecha }) =>
      ({ id, nombre, tipo, material, genero, sub, marca, precio, precioAnterior, desc, imgs, destacado: !!destacado, fecha }))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.id - a.id));
  return {
    productos, anuncios: d.anuncios ?? ANUNCIOS_DEFAULT,
    etiquetas: { tipos: TIPOS, materiales: MATERIALES, generos: GENEROS, marcas: MARCAS },   // nombres para mostrar (única fuente)
  };
}
export async function datosPublicos() { return publicos(await leer(store())); }

/* ------------------------------------------------------------------ */
/* Sesión y contraseña                                                 */
/* ------------------------------------------------------------------ */
function secreto() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error('Falta la variable de entorno SESSION_SECRET (mínimo 24 caracteres)');
  return s;
}
export function firmar(payload) {
  const b = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return b + '.' + createHmac('sha256', secreto()).update(b).digest('base64url');
}
export function verificar(token) {
  if (!token || typeof token !== 'string' || token.length > 2000) return null;
  const [b, sig] = token.split('.');
  if (!b || !sig) return null;
  const esperada = createHmac('sha256', secreto()).update(b).digest();
  let recibida; try { recibida = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try { const p = JSON.parse(Buffer.from(b, 'base64url').toString('utf8')); return p.exp > Date.now() ? p : null; } catch { return null; }
}
export function leerCookie(req) {
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)alteza_sesion=([^;]+)/);
  return m ? m[1] : '';
}
export const cookieSesion = (token, segundos) => `alteza_sesion=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${segundos}`;

const sha = (t) => createHash('sha256').update(String(t)).digest();
const iguales = (a, b) => timingSafeEqual(sha(a), sha(b));

/**
 * La contraseña que elige el dueño se guarda hasheada (scrypt) en el store.
 * Las variables ADMIN_USER / ADMIN_PASSWORD de Netlify funcionan siempre como llave maestra del desarrollador,
 * así, si el dueño se olvida la contraseña, entrás vos y se la cambiás.
 */
export async function claveValida(usuario, clave) {
  usuario = String(usuario || '').trim().toLowerCase(); clave = String(clave || '');
  if (!usuario || !clave || clave.length > 200) return false;
  const a = await store().get('auth', { type: 'json' });
  if (a?.hash && a.u && iguales(usuario, String(a.u).toLowerCase())) {
    const h = scryptSync(clave, Buffer.from(a.salt, 'base64'), 64);
    if (timingSafeEqual(h, Buffer.from(a.hash, 'base64'))) return true;
  }
  const u = process.env.ADMIN_USER, p = process.env.ADMIN_PASSWORD;
  if (!u || !p) { if (!a) console.error('Faltan las variables ADMIN_USER y ADMIN_PASSWORD'); return false; }
  return iguales(usuario, u.toLowerCase()) && iguales(clave, p);
}
export async function guardarClave(usuario, nueva) {
  const salt = randomBytes(16);
  await store().setJSON('auth', { u: str(usuario, 60), salt: salt.toString('base64'), hash: scryptSync(nueva, salt, 64).toString('base64'), t: Date.now() });
}
