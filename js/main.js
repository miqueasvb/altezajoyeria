AOS.init({
    duration: 800,
    easing: 'slide',
    once: true
});

jQuery(document).ready(function($) {
    "use strict";

    // 1. Slider de productos
    var slider = function() {
        $('.nonloop-block-3').owlCarousel({
            center: false,
            items: 1,
            loop: false,
            stagePadding: 15,
            margin: 20,
            nav: true,
            navText: ['<span class="icon-arrow_back">', '<span class="icon-arrow_forward">'],
            responsive:{
                600:{ margin: 20, items: 2 },
                1000:{ margin: 20, items: 3 },
                1200:{ margin: 20, items: 3 }
            }
        });
    };
    slider();

    // 2. Menú Mobile
    var siteMenuClone = function() {
        $('<div class="site-mobile-menu"></div>').prependTo('.site-wrap');
        $('<div class="site-mobile-menu-header"></div>').prependTo('.site-mobile-menu');
        $('<div class="site-mobile-menu-close "></div>').prependTo('.site-mobile-menu-header');
        $('<div class="site-mobile-menu-logo"></div>').prependTo('.site-mobile-menu-header');
        $('<div class="site-mobile-menu-body"></div>').appendTo('.site-mobile-menu');

        $('.js-logo-clone').clone().appendTo('.site-mobile-menu-logo');
        $('<span class="ion-ios-close js-menu-toggle"></div>').prependTo('.site-mobile-menu-close');

        $('.js-clone-nav').each(function() {
            var $this = $(this);
            $this.clone().attr('class', 'site-nav-wrap').appendTo('.site-mobile-menu-body');
        });

        setTimeout(function() {
            var counter = 0;
            $('.site-mobile-menu .has-children').each(function(){
                var $this = $(this);
                $this.prepend('<span class="arrow-collapse collapsed">');
                $this.find('.arrow-collapse').attr({
                    'data-toggle' : 'collapse',
                    'data-target' : '#collapseItem' + counter,
                });
                $this.find('> ul').attr({
                    'class' : 'collapse',
                    'id' : 'collapseItem' + counter,
                });
                counter++;
            });
        }, 1000);

        $('body').on('click', '.js-menu-toggle', function(e) {
            e.preventDefault();
            if ( $('body').hasClass('offcanvas-menu') ) {
                $('body').removeClass('offcanvas-menu');
            } else {
                $('body').addClass('offcanvas-menu');
            }
        });
    };
    siteMenuClone();

    // 3. Buscador
    var searchShow = function() {
        var searchWrap = $('.search-wrap');
        $('.js-search-open').on('click', function(e) {
            e.preventDefault();
            searchWrap.addClass('active');
            setTimeout(function() { searchWrap.find('.form-control').focus(); }, 300);
        });
        $('.js-search-close').on('click', function(e) {
            e.preventDefault();
            searchWrap.removeClass('active');
        });
    };
    searchShow();


});







document.addEventListener("DOMContentLoaded", () => {
  // Cargar Novedades desde el JSON de Decap CMS
  fetch('/content/novedades.json')
    .then(response => response.json())
    .then(data => {
      const contenedor = document.getElementById('contenedor-novedades');
      if (!contenedor) return;

      contenedor.innerHTML = data.productos.map(prod => {
        // Si tiene precio anterior, lo muestra tachado
        const precioHTML = prod.old_price && prod.old_price.trim() !== "" 
          ? `<del>${prod.old_price}</del> ${prod.price}`
          : `${prod.price}`;

        return `
          <div class="col-lg-4 col-md-6 item-entry mb-4">
            <a href="#" class="product-item md-height bg-gray d-block open-modal" 
               data-name="${prod.name}" 
               data-price="${prod.price}" 
               data-img="${prod.image}">
              <img src="${prod.image}" alt="${prod.name}" class="img-fluid">
            </a>
            <h2 class="item-title"><a href="#">${prod.name}</a></h2>
            <strong class="item-price">${precioHTML}</strong>
          </div>
        `;
      }).join('');
    })
    .catch(error => console.error('Error al cargar novedades:', error));
});



let PRODUCTOS = [];

// 1. Cargar el JSON generado por Decap CMS
async function iniciarCatalogo() {
  try {
    const res = await fetch('content/productos.json');
    const data = await res.json();
    
    // Extraemos la lista 'productos' del JSON que genera el CMS
    PRODUCTOS = data.productos || [];
    
    // Al recibir los datos, calculamos los contadores del sidebar y renderizamos
    actualizarContadoresSidebar();
    filtrarYRenderizar();
  } catch (err) {
    console.error("Error cargando el catálogo:", err);
  }
}

// 2. Mapear dinámicamente las cantidades (ej: Plata 925 -> Anillos (2))
function actualizarContadoresSidebar() {
  // Combos Material|Tipo (data-count-combo="plata|anillos")
  document.querySelectorAll('[data-count-combo]').forEach(el => {
    const [mat, tipo] = el.getAttribute('data-count-combo').split('|');
    const cant = PRODUCTOS.filter(p => p.material === mat && p.tipo === tipo).length;
    el.textContent = cant > 0 ? `(${cant})` : '(0)';
  });

  // Género (data-count-genero="dama")
  document.querySelectorAll('[data-count-genero]').forEach(el => {
    const gen = el.getAttribute('data-count-genero');
    const cant = PRODUCTOS.filter(p => p.genero === gen).length;
    el.textContent = cant > 0 ? `(${cant})` : '(0)';
  });

  // Detalle (data-count-sub="con-piedras")
  document.querySelectorAll('[data-count-sub]').forEach(el => {
    const sub = el.getAttribute('data-count-sub');
    const cant = PRODUCTOS.filter(p => p.sub === sub).length;
    el.textContent = cant > 0 ? `(${cant})` : '(0)';
  });

  // Marcas de relojes (data-count-marca="citizen")
  document.querySelectorAll('[data-count-marca]').forEach(el => {
    const marca = el.getAttribute('data-count-marca');
    const cant = PRODUCTOS.filter(p => p.marca === marca).length;
    el.textContent = cant > 0 ? `(${cant})` : '(0)';
  });
}

// Función auxiliar para formatear los precios estilo AR
function formatPrice(n) {
  if (!n && n !== 0) return '';
  return '$' + Number(n).toLocaleString('es-AR');
}

// 3. Filtrar y Renderizar en #productosGrid
function filtrarYRenderizar() {
  const combos = Array.from(document.querySelectorAll('input[data-group="combo"]:checked')).map(i => i.value);
  const generos = Array.from(document.querySelectorAll('input[data-group="genero"]:checked')).map(i => i.value);
  const subs = Array.from(document.querySelectorAll('input[data-group="sub"]:checked')).map(i => i.value);
  const marcas = Array.from(document.querySelectorAll('input[data-group="marca"]:checked')).map(i => i.value);

  const desde = parseFloat(document.getElementById('precioDesde')?.value) || 0;
  const hasta = parseFloat(document.getElementById('precioHasta')?.value) || Infinity;
  const orden = document.getElementById('ordenSelect')?.value || 'destacado';

  let filtrados = PRODUCTOS.filter(p => {
    // Filtro por combos (ej: "plata|anillos")
    if (combos.length > 0) {
      const miCombo = `${p.material}|${p.tipo}`;
      if (!combos.includes(miCombo)) return false;
    }

    // Filtro Género
    if (generos.length > 0 && !generos.includes(p.genero)) return false;

    // Filtro Subcategoría
    if (subs.length > 0 && !subs.includes(p.sub)) return false;

    // Filtro Marca
    if (marcas.length > 0 && !marcas.includes(p.marca)) return false;

    // Rango de precio
    if (p.precio < desde || p.precio > hasta) return false;

    return true;
  });

  // Ordenamiento
  if (orden === 'precio-asc') filtrados.sort((a, b) => a.precio - b.precio);
  if (orden === 'precio-desc') filtrados.sort((a, b) => b.precio - a.precio);
  if (orden === 'nombre-asc') filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Render HTML
  const grid = document.getElementById('productosGrid');
  const countEl = document.getElementById('resultCount');
  const emptyEl = document.getElementById('catalogoEmpty');

  if (countEl) countEl.textContent = filtrados.length;

  if (filtrados.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';

    grid.innerHTML = filtrados.map(p => {
      // 1. Armar HTML para precio anterior / oferta
      const tieneDescuento = p.old_price && parseFloat(p.old_price) > p.precio;
      const precioHtml = tieneDescuento
        ? `<span class="anterior">${formatPrice(p.old_price)}</span><span class="actual">${formatPrice(p.precio)}</span>`
        : `<span class="actual">${formatPrice(p.precio)}</span>`;

      // 2. Etiqueta % OFF
      const offHtml = tieneDescuento
        ? `<span class="producto-off">${Math.round((1 - p.precio / parseFloat(p.old_price)) * 100)}% OFF</span>`
        : '';

      // 3. Etiqueta de material / marca
      let matLabelText = p.material_label || p.material || '';
      if (!matLabelText && p.marca) matLabelText = 'Relojería';
      const matLabelHtml = matLabelText 
        ? `<span class="producto-material">${matLabelText}</span>` 
        : '';

      // 4. Retornar la tarjeta exacta que tenías en catalogo.html
      return `
        <div class="col-6 col-md-6 col-lg-4 mb-4">
          <a href="#" class="producto-card open-modal" 
             data-name="${p.nombre}" 
             data-price="${formatPrice(p.precio)}" 
             data-img="${p.imagen}">
            <div class="producto-imgwrap">
              ${offHtml}
              <img src="${p.imagen}" alt="${p.nombre}">
            </div>
            ${matLabelHtml}
            <div class="producto-nombre">${p.nombre}</div>
            <div class="producto-precio">${precioHtml}</div>
            <span class="producto-consultar">Consultar →</span>
          </a>
        </div>
      `;
    }).join('');
  }
}

// Eventos de interactividad con los filtros
document.addEventListener('change', e => {
  if (e.target.matches('input[type="checkbox"], #ordenSelect')) {
    filtrarYRenderizar();
  }
});

document.getElementById('aplicarPrecio')?.addEventListener('click', filtrarYRenderizar);
document.getElementById('filtrosClear')?.addEventListener('click', () => {
  document.querySelectorAll('.filtros-sidebar input[type="checkbox"]').forEach(c => c.checked = false);
  if (document.getElementById('precioDesde')) document.getElementById('precioDesde').value = '';
  if (document.getElementById('precioHasta')) document.getElementById('precioHasta').value = '';
  filtrarYRenderizar();
});

// Arrancar al cargar la vista catalogo.html
document.addEventListener('DOMContentLoaded', iniciarCatalogo);
