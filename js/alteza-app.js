/*!
 * Alteza Joyería · lógica pública compartida (home + catálogo)
 * Lee window.ALTEZA, que entrega /api/catalogo.js con lo que carga el dueño desde /admin.
 * Reemplaza los scripts sueltos que había en index.html y catalogo.html.
 */
(function () {
  'use strict';

  var WA = '5493644305999';
  var SITE = 'https://altezajoyeria.com.ar';
  var DATA = window.ALTEZA || { productos: [], anuncios: [] };
  var ET = DATA.etiquetas || { tipos: {}, materiales: {}, generos: {}, marcas: {} };

  /* ---------- utilidades ---------- */
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '$' + Number(n).toLocaleString('es-AR'); }
  function foto(k, mini) { return '/media/' + k + (mini ? '-m' : '') + '.jpg'; }
  function byId(id) { return document.getElementById(id); }

  /* ---------- datos ---------- */
  function adaptar(p) {
    var imgs = p.imgs || [];
    var oferta = p.precio && p.precioAnterior > p.precio;
    var matLabel = null;
    if (p.tipo === 'relojes') matLabel = ET.marcas[p.marca] || 'Relojería';
    else if (p.material) matLabel = ET.materiales[p.material] || null;
    return {
      id: p.id, name: p.nombre, tipo: p.tipo, material: p.material || null, genero: p.genero || null,
      sub: p.sub || null, marca: p.marca || null,
      price: p.precio || 0, oldPrice: oferta ? p.precioAnterior : null, consultar: !p.precio,
      imgs: imgs, img: imgs[0] ? foto(imgs[0]) : '', thumb: imgs[0] ? foto(imgs[0], true) : '',
      desc: p.desc || '', destacado: !!p.destacado, fecha: p.fecha || '', matLabel: matLabel,
      tipoLabel: ET.tipos[p.tipo] || ''
    };
  }

  var PRODUCTOS = (DATA.productos || []).map(adaptar);
  // Orden del catálogo: destacados primero y, dentro de cada grupo, lo más nuevo (el servidor ya los manda del más nuevo al más viejo)
  PRODUCTOS = PRODUCTOS.filter(function (p) { return p.destacado; }).concat(PRODUCTOS.filter(function (p) { return !p.destacado; }));
  var POR_ID = {};
  PRODUCTOS.forEach(function (p) { POR_ID[p.id] = p; });

  /* ---------- piezas de HTML ---------- */
  function descuento(p) { return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0; }

  function precioHtml(p) {
    if (p.consultar) return '<span class="actual">Consultar precio</span>';
    return (p.oldPrice ? '<span class="anterior">' + money(p.oldPrice) + '</span>' : '') + '<span class="actual">' + money(p.price) + '</span>';
  }

  /* tarjeta de la home (mismo diseño que ya tenía el sitio) */
  function homeCard(p) {
    var precio = p.consultar ? 'Consultar precio' : (p.oldPrice ? '<del>' + money(p.oldPrice) + '</del> ' : '') + money(p.price);
    return '<div class="col-lg-4 col-md-6 item-entry mb-4">' +
      '<a href="#" class="product-item md-height bg-gray d-block open-modal" data-id="' + p.id + '" aria-label="Ver ' + esc(p.name) + '">' +
      '<img src="' + esc(p.thumb) + '" alt="' + esc(p.name) + '" class="img-fluid" loading="lazy"></a>' +
      '<h2 class="item-title"><a href="#" class="open-modal" data-id="' + p.id + '">' + esc(p.name) + '</a></h2>' +
      '<strong class="item-price">' + precio + '</strong></div>';
  }

  /* tarjeta del catálogo */
  function catalogCard(p) {
    var off = p.oldPrice ? '<span class="producto-off">' + descuento(p) + '% OFF</span>' : '';
    var mat = p.matLabel ? '<span class="producto-material">' + esc(p.matLabel) + '</span>' : '';
    return '<div class="col-6 col-md-6 col-lg-4">' +
      '<a href="#" class="producto-card open-modal" data-id="' + p.id + '">' +
      '<div class="producto-imgwrap">' + off + '<img src="' + esc(p.thumb) + '" alt="' + esc(p.name) + '" loading="lazy"></div>' +
      mat +
      '<div class="producto-nombre">' + esc(p.name) + '</div>' +
      '<div class="producto-precio">' + precioHtml(p) + '</div>' +
      '<span class="producto-consultar">Consultar →</span></a></div>';
  }

  /* ---------- modal de producto ---------- */
  function modalEl() { return byId('productModal'); }

  function llenarModal(p) {
    var cat = p.tipo === 'relojes' ? 'Relojería' + (p.marca && ET.marcas[p.marca] ? ' · ' + ET.marcas[p.marca] : '')
      : [p.tipoLabel, p.matLabel].filter(Boolean).join(' · ');
    byId('modalCategory').textContent = cat || 'Colección Alteza';
    byId('modalTitle').textContent = p.name;
    byId('modalPrice').innerHTML = p.consultar ? 'Consultar precio'
      : (p.oldPrice ? '<del>' + money(p.oldPrice) + '</del>' : '') + money(p.price) +
        (p.oldPrice ? '<span class="modal-off">' + descuento(p) + '% OFF</span>' : '');
    var d = byId('modalDesc'); if (d) d.textContent = p.desc;

    var img = byId('modalImg'); img.src = p.img; img.alt = p.name;
    var th = byId('modalThumbs');
    if (th) {
      th.innerHTML = p.imgs.length > 1 ? p.imgs.map(function (k, i) {
        return '<button type="button" class="modal-thumb' + (i === 0 ? ' is-active' : '') + '" data-k="' + esc(k) + '" aria-label="Ver foto ' + (i + 1) + '"><img src="' + esc(foto(k, true)) + '" alt=""></button>';
      }).join('') : '';
    }
    var msg = p.consultar ? '¡Hola Alteza! Quería consultar el precio de: ' + p.name
      : '¡Hola Alteza! Me interesa el producto: ' + p.name + ' (' + money(p.price) + ')';
    byId('modalWhatsapp').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
  }

  function mostrarModal() {
    var m = modalEl(), $ = window.jQuery;
    if ($ && typeof $.fn.modal === 'function') { $(m).modal('show'); return; }
    m.classList.add('show'); m.style.display = 'block'; document.body.classList.add('modal-open');   // sin Bootstrap: lo hacemos a mano
  }
  function cerrarModalManual() {
    var m = modalEl(); if (!m) return;
    m.classList.remove('show'); m.style.display = 'none'; document.body.classList.remove('modal-open');
  }

  document.addEventListener('click', function (e) {
    var abre = e.target.closest && e.target.closest('.open-modal');
    if (abre) {
      var p = POR_ID[abre.getAttribute('data-id')];
      e.preventDefault(); e.stopPropagation();
      if (p && modalEl()) { llenarModal(p); mostrarModal(); }
      return;
    }
    var th = e.target.closest && e.target.closest('.modal-thumb');
    if (th) {
      byId('modalImg').src = foto(th.getAttribute('data-k'));
      Array.prototype.forEach.call(document.querySelectorAll('.modal-thumb'), function (b) { b.classList.toggle('is-active', b === th); });
      return;
    }
    var m = modalEl();
    if (m && m.classList.contains('show') && !(window.jQuery && window.jQuery.fn.modal) &&
        (e.target === m || (e.target.closest && e.target.closest('[data-dismiss="modal"]')))) cerrarModalManual();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalEl() && modalEl().classList.contains('show') && !(window.jQuery && window.jQuery.fn.modal)) cerrarModalManual();
  });

  /* ---------- barra de anuncios (solo existe en la home) ---------- */
  function renderAnuncios() {
    var bar = byId('topBarAnnouncement'); if (!bar) return;
    var msgs = (DATA.anuncios || []).filter(Boolean);
    if (!msgs.length) { bar.style.display = 'none'; return; }
    // Repetimos los mensajes hasta cubrir el ancho de pantalla, así el recorrido no se corta ni deja huecos
    var largo = msgs.reduce(function (a, m) { return a + m.length * 9 + 120; }, 0);
    var veces = Math.max(1, Math.ceil(Math.max(window.innerWidth, 1400) / largo));
    var bloque = '';
    for (var i = 0; i < veces; i++) bloque += msgs.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('');
    bar.innerHTML = '<div class="announcement-slider"><div class="announcement-content">' + bloque + '</div>' +
      '<div class="announcement-content" aria-hidden="true">' + bloque + '</div></div>';
  }

  /* ---------- secciones de la home ---------- */
  function llenar(idContenedor, lista) {
    var c = byId(idContenedor); if (!c) return;
    var sec = c.closest('.site-section');
    c.innerHTML = lista.map(homeCard).join('');
    if (sec) sec.style.display = lista.length ? '' : 'none';
  }

  function renderHome() {
    if (!byId('contenedor-destacados')) return;
    var todos = PRODUCTOS.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.id - a.id; });

    if (!todos.length) {              // todavía no hay nada cargado (o falló la carga): invitamos a consultar
      var c = byId('contenedor-destacados');
      c.innerHTML = '<div class="col-12 alteza-vacio"><p>Estamos preparando nuestro catálogo online. Mientras tanto, consultanos por WhatsApp y te mostramos las piezas disponibles.</p>' +
        '<a href="https://wa.me/' + WA + '" target="_blank" rel="noopener" class="btn-alteza-minimal whatsapp-style"><span class="icon-whatsapp"></span><span>Consultar por WhatsApp</span></a></div>';
      llenar('contenedor-novedades', []); llenar('contenedor-ofertas', []);
      return;
    }

    var dest = todos.filter(function (p) { return p.destacado; }).slice(0, 6);
    if (!dest.length) dest = todos.slice(0, 6);                                   // sin destacados marcados: los 6 más nuevos
    var usados = {}; dest.forEach(function (p) { usados[p.id] = 1; });
    var nov = todos.filter(function (p) { return !usados[p.id]; }).slice(0, 6);   // novedades sin repetir los destacados
    var ofe = todos.filter(function (p) { return p.oldPrice; })
      .sort(function (a, b) { return descuento(b) - descuento(a); }).slice(0, 6);

    llenar('contenedor-destacados', dest);
    llenar('contenedor-novedades', nov);
    llenar('contenedor-ofertas', ofe);
  }

  /* ---------- datos estructurados para Google (solo en el catálogo) ---------- */
  function schemaCatalogo() {
    if (!byId('productosGrid') || !PRODUCTOS.length) return;
    var lista = PRODUCTOS.slice(0, 50).map(function (p, i) {
      var item = { '@type': 'Product', name: p.name, image: SITE + p.img, url: SITE + '/catalogo' };
      if (p.desc) item.description = p.desc;
      if (p.tipo === 'relojes' && p.marca && ET.marcas[p.marca]) item.brand = { '@type': 'Brand', name: ET.marcas[p.marca] };
      if (!p.consultar) item.offers = { '@type': 'Offer', priceCurrency: 'ARS', price: p.price, availability: 'https://schema.org/InStock', url: SITE + '/catalogo' };
      return { '@type': 'ListItem', position: i + 1, item: item };
    });
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: lista });
    document.head.appendChild(s);
  }

  /* ---------- API para las páginas ---------- */
  window.Alteza = { productos: PRODUCTOS, porId: POR_ID, esc: esc, money: money, foto: foto, precioHtml: precioHtml, catalogCard: catalogCard, homeCard: homeCard };

  function iniciar() { renderAnuncios(); renderHome(); schemaCatalogo(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
