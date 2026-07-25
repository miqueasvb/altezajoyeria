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

// 1. Cargar datos del JSON de GitHub
async function cargarCatalogo() {
  try {
    const respuesta = await fetch('content/productos.json');
    PRODUCTOS = await respuesta.json();
    
    // Una vez cargados los productos actualizamos la interfaz
    actualizarContadoresSidebar();
    filtrarYRenderizar();
  } catch (error) {
    console.error("Error al cargar los productos:", error);
  }
}

// 2. Función que calcula automáticamente los números al lado de cada checkbox (ej: Plata 925 -> Anillos (3))
function actualizarContadoresSidebar() {
  // Contadores por combo Material|Tipo (ej: plata|anillos)
  document.querySelectorAll('[data-count-combo]').forEach(el => {
    const combo = el.getAttribute('data-count-combo'); // ej: "plata|anillos"
    const [mat, tipo] = combo.split('|');
    const total = PRODUCTOS.filter(p => p.material === mat && p.tipo === tipo).length;
    el.textContent = total > 0 ? `(${total})` : '(0)';
  });

  // Contadores por Género
  document.querySelectorAll('[data-count-genero]').forEach(el => {
    const genero = el.getAttribute('data-count-genero');
    const total = PRODUCTOS.filter(p => p.genero === genero).length;
    el.textContent = total > 0 ? `(${total})` : '(0)';
  });

  // Contadores por Detalle/Sub
  document.querySelectorAll('[data-count-sub]').forEach(el => {
    const sub = el.getAttribute('data-count-sub');
    const total = PRODUCTOS.filter(p => p.sub === sub).length;
    el.textContent = total > 0 ? `(${total})` : '(0)';
  });

  // Contadores por Marca
  document.querySelectorAll('[data-count-marca]').forEach(el => {
    const marca = el.getAttribute('data-count-marca');
    const total = PRODUCTOS.filter(p => p.marca === marca).length;
    el.textContent = total > 0 ? `(${total})` : '(0)';
  });
}

// 3. Lógica principal de Filtros y Orden
function filtrarYRenderizar() {
  // Obtener seleccionados
  const combosSeleccionados = Array.from(document.querySelectorAll('input[data-group="combo"]:checked')).map(i => i.value);
  const generosSeleccionados = Array.from(document.querySelectorAll('input[data-group="genero"]:checked')).map(i => i.value);
  const subsSeleccionados = Array.from(document.querySelectorAll('input[data-group="sub"]:checked')).map(i => i.value);
  const marcasSeleccionadas = Array.from(document.querySelectorAll('input[data-group="marca"]:checked')).map(i => i.value);

  const precioDesde = parseFloat(document.getElementById('precioDesde')?.value) || 0;
  const precioHasta = parseFloat(document.getElementById('precioHasta')?.value) || Infinity;
  const orden = document.getElementById('ordenSelect')?.value || 'destacado';

  // Filtrar
  let resultado = PRODUCTOS.filter(p => {
    // Filtro Categoría/Material (combo)
    if (combosSeleccionados.length > 0) {
      const pCombo = `${p.material}|${p.tipo}`;
      if (!combosSeleccionados.includes(pCombo)) return false;
    }

    // Filtro Género
    if (generosSeleccionados.length > 0 && !generosSeleccionados.includes(p.genero)) {
      return false;
    }

    // Filtro Subcategoría
    if (subsSeleccionados.length > 0 && !subsSeleccionados.includes(p.sub)) {
      return false;
    }

    // Filtro Marca (Relojes)
    if (marcasSeleccionadas.length > 0 && !marcasSeleccionadas.includes(p.marca)) {
      return false;
    }

    // Filtro Rango de Precio
    if (p.precio < precioDesde || p.precio > precioHasta) {
      return false;
    }

    return true;
  });

  // Ordenar
  if (orden === 'precio-asc') resultado.sort((a, b) => a.precio - b.precio);
  if (orden === 'precio-desc') resultado.sort((a, b) => b.precio - a.precio);
  if (orden === 'nombre-asc') resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Renderizar Grilla
  const grid = document.getElementById('productosGrid');
  const countEl = document.getElementById('resultCount');
  
  if (countEl) countEl.textContent = resultado.length;

  if (resultado.length === 0) {
    grid.innerHTML = '';
    document.getElementById('catalogoEmpty').style.display = 'block';
  } else {
    document.getElementById('catalogoEmpty').style.display = 'none';
    grid.innerHTML = resultado.map(p => `
      <div class="col-6 col-md-4 mb-4">
        <div class="card-producto">
          <img src="${p.imagen}" alt="${p.nombre}" class="img-fluid">
          <h3>${p.nombre}</h3>
          <p class="precio">$${p.precio.toLocaleString('es-AR')}</p>
        </div>
      </div>
    `).join('');
  }
}

// Event Listeners para cambios en los checkboxes y ordenamiento
document.addEventListener('change', (e) => {
  if (e.target.matches('input[type="checkbox"], #ordenSelect')) {
    filtrarYRenderizar();
  }
});

document.getElementById('aplicarPrecio')?.addEventListener('click', filtrarYRenderizar);

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', cargarCatalogo);
