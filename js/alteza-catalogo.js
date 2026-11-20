/* Alteza · catálogo: pestañas de categoría y navegación de fotos del modal.
   No reemplaza el filtrado del catálogo: marca y desmarca los mismos checkboxes del panel
   de filtros, así que todo lo que ya funcionaba (contadores, URL, orden) sigue igual. */
(function () {
  var side = document.getElementById('filtrosSidebar');
  var tabsEl = document.getElementById('catTabs');
  var chipsEl = document.getElementById('catChips');
  if (!side || !tabsEl || !chipsEl) return;

  var TABS = [
    { id: 'todo', nombre: 'Todo' },
    { id: 'oro', nombre: 'Oro', test: function (v) { return /^oro\|/.test(v) && !/\|(alianzas|cintillos)$/.test(v); } },
    { id: 'plata', nombre: 'Plata 925', test: function (v) { return /^plata\|/.test(v) && !/\|alianzas$/.test(v); } },
    { id: 'boda', nombre: 'Boda y Compromiso', test: function (v) { return /\|alianzas$/.test(v) || v === 'oro|cintillos'; } },
    { id: 'relojes', nombre: 'Relojería' }
  ];
  var tabActual = 'todo';

  function todos() { return [].slice.call(side.querySelectorAll('input[type="checkbox"]')); }
  function porGrupo(g) { return todos().filter(function (i) { return i.getAttribute('data-group') === g; }); }
  function combosDe(tab) { return porGrupo('combo').filter(function (i) { return tab.test(i.value); }); }
  function etiqueta(input) { return (input.nextSibling ? input.nextSibling.textContent : input.value).trim(); }
  function tabPorId(id) { return TABS.filter(function (t) { return t.id === id; })[0]; }

  function aplicar() {
    // un solo evento alcanza: el catálogo lee el estado de todos los checkboxes
    var base = todos()[0];
    if (base) base.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function limpiarCategoria() {
    ['combo', 'marca', 'relojesTodos'].forEach(function (g) { porGrupo(g).forEach(function (i) { i.checked = false; }); });
  }

  function elegirTab(id) {
    limpiarCategoria();
    var t = tabPorId(id);
    if (id === 'relojes') porGrupo('relojesTodos').forEach(function (i) { i.checked = true; });
    else if (t.test) combosDe(t).forEach(function (i) { i.checked = true; });
    aplicar();
  }

  function elegirChip(input) {
    var t = tabPorId(tabActual);
    if (tabActual === 'relojes') {
      porGrupo('relojesTodos').forEach(function (i) { i.checked = false; });
      input.checked = !input.checked;
      if (!porGrupo('marca').some(function (i) { return i.checked; })) porGrupo('relojesTodos').forEach(function (i) { i.checked = true; });
    } else {
      var lista = combosDe(t), soloEste = lista.every(function (i) { return i.checked === (i === input); });
      lista.forEach(function (i) { i.checked = soloEste ? true : i === input; });
    }
    aplicar();
  }

  function detectarTab() {
    var marcas = porGrupo('marca').some(function (i) { return i.checked; });
    var reloj = porGrupo('relojesTodos').some(function (i) { return i.checked; });
    if (marcas || reloj) return 'relojes';
    var activos = porGrupo('combo').filter(function (i) { return i.checked; });
    if (!activos.length) return 'todo';
    var t = TABS.filter(function (t) { return t.test && activos.every(function (i) { return t.test(i.value); }); })[0];
    return t ? t.id : 'todo';
  }

  function dibujar() {
    tabActual = detectarTab();
    tabsEl.innerHTML = TABS.map(function (t) {
      return '<button type="button" class="cat-tab' + (t.id === tabActual ? ' is-active' : '') + '" data-tab="' + t.id + '">' + t.nombre + '</button>';
    }).join('');

    var chips = '', items = [];
    if (tabActual === 'relojes') {
      var todosRel = porGrupo('relojesTodos')[0];
      chips = '<button type="button" class="cat-chip' + (todosRel && todosRel.checked ? ' is-active' : '') + '" data-todos="1">Todas las marcas</button>';
      items = porGrupo('marca');
    } else if (tabActual !== 'todo') {
      items = combosDe(tabPorId(tabActual));
      var todasMarcadas = items.length && items.every(function (i) { return i.checked; });
      chips = '<button type="button" class="cat-chip' + (todasMarcadas ? ' is-active' : '') + '" data-todos="1">Todos</button>';
    }
    if (items.length > 1 || tabActual === 'relojes') {
      var todasMarcadas2 = items.length && items.every(function (i) { return i.checked; });
      chips += items.map(function (i, n) {
        var activo = i.checked && !(tabActual !== 'relojes' && todasMarcadas2);
        return '<button type="button" class="cat-chip' + (activo ? ' is-active' : '') + '" data-n="' + n + '">' + etiqueta(i) + '</button>';
      }).join('');
      chipsEl.innerHTML = chips;
    } else chipsEl.innerHTML = '';
    chipsEl._items = items;
  }

  tabsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]'); if (b) elegirTab(b.getAttribute('data-tab'));
  });
  chipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-todos')) elegirTab(tabActual);
    else elegirChip(chipsEl._items[+b.getAttribute('data-n')]);
  });
  side.addEventListener('change', dibujar);
  ['filtrosClear', 'verTodoBtn'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', function () { setTimeout(dibujar, 0); });
  });

  // la categoría ya está en las pestañas: el grupo "Categorías" del panel queda oculto (sigue funcionando por debajo)
  [].forEach.call(side.querySelectorAll('.filtro-grupo'), function (g) {
    var t = g.querySelector('.filtro-grupo-titulo');
    if (t && /categor/i.test(t.textContent)) g.classList.add('is-oculto');
  });
  dibujar();

  /* ---- fotos del modal: flechas y deslizar con el dedo ---- */
  var modal = document.getElementById('productModal');
  function moverFoto(paso) {
    var thumbs = [].slice.call(document.querySelectorAll('#modalThumbs .modal-thumb'));
    if (thumbs.length < 2) return;
    var i = thumbs.findIndex(function (t) { return t.classList.contains('is-active'); });
    thumbs[(i + paso + thumbs.length) % thumbs.length].click();
  }
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target.closest('.pm-prev')) moverFoto(-1);
      else if (e.target.closest('.pm-next')) moverFoto(1);
    });
    var x0 = null, stage = modal.querySelector('.pm-stage');
    if (stage) {
      stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) moverFoto(dx < 0 ? 1 : -1);
      });
    }
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('show')) return;
      if (e.key === 'ArrowLeft') moverFoto(-1); else if (e.key === 'ArrowRight') moverFoto(1);
    });
  }
})();
