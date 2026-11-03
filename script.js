/* ==========================================================
   SWEET BAKERY · script.js (v12)
   Cotizador, estado del local, galería y mensajes de WhatsApp.
   ========================================================== */

(function () {
  'use strict';

  /* ── CONFIGURACIÓN ──────────────────────────────────────
     Todo lo que cambia con el tiempo vive aquí arriba.
     ------------------------------------------------------- */

  var WHATSAPP_NUMBER = '5216142868000'; // WhatsApp Business (formato internacional, sin +)
  var MIN_DAYS_AHEAD  = 4;               // anticipación mínima para pastel personalizado

  // 0 = domingo, 1 = lunes … 6 = sábado. null = cerrado.
  var SCHEDULE = {
    0: null,
    1: { open: 10, close: 19 },
    2: { open: 10, close: 19 },
    3: { open: 10, close: 19 },
    4: { open: 10, close: 19 },
    5: { open: 10, close: 19 },
    6: { open: 10, close: 16 }
  };

  // Sabor del mes. Deja `nombre` en null para mostrar el texto genérico
  // ("Pregunta por el sabor de este mes") sin tener que tocar el HTML.
  var SABOR_MES = {
    nombre: null,
    descripcion: null
  };

  /* ── PRECIOS (según la lista oficial de Sweet Bakery) ──── */

  // Betún: el precio de Orillas/Vintage/Peludito cambia según el tamaño.
  // "small" = Mini a Chico · "large" = Mediano y Grande.
  var BETUN_OPTIONS = {
    small: [
      { label: 'Orillas',           price: 20 },
      { label: 'Vintage',           price: 50 },
      { label: 'Peludito',          price: 60 }
    ],
    large: [
      { label: 'Orillas',           price: 30 },
      { label: 'Vintage',           price: 80 },
      { label: 'Peludito',          price: 100 }
    ],
    // Mismo precio en cualquier tamaño
    fijos: [
      { label: 'Cúpula',            price: 60 },
      { label: 'Dibujo sencillo',   price: 60 },
      { label: 'Dibujo elaborado',  price: 100 },
      { label: 'Dripp',             price: 20 }
    ]
  };

  // Tiritas de oblea: el precio depende del tamaño del pastel.
  var TIRITAS_OBLEA = {
    'Lunchbox': 100,
    'Pequeño':  200,
    'Chico':    200,
    'Mediano':  300,
    'Grande':   400
  };

  var MACARON_PRICE = 20;
  var MACARON_MAX   = 6;

  /* ── HELPERS ────────────────────────────────────────────── */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function formatMoney(n) { return '$' + Math.round(n).toLocaleString('es-MX'); }
  function toLocalISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // "2026-09-07" → Date local (evita el corrimiento de zona horaria de new Date(str))
  function parseLocalDate(str) {
    if (!str) return null;
    var p = str.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function formatPickupDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function isClosedDay(date) { return !SCHEDULE[date.getDay()]; }

  /* ── 1) ESTADO DEL LOCAL ────────────────────────────────── */

  function isStoreOpenNow() {
    var now = new Date();
    var sched = SCHEDULE[now.getDay()];
    if (!sched) return false;
    var hours = now.getHours() + now.getMinutes() / 60;
    return hours >= sched.open && hours < sched.close;
  }

  // Próximo momento en que abrimos, en texto corto ("mañana a las 10:00").
  function nextOpeningText() {
    var now = new Date();
    for (var i = 0; i < 8; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      var sched = SCHEDULE[d.getDay()];
      if (!sched) continue;
      if (i === 0) {
        var h = now.getHours() + now.getMinutes() / 60;
        if (h < sched.open) return 'hoy a las ' + pad(sched.open) + ':00';
        continue; // ya cerramos por hoy
      }
      if (i === 1) return 'mañana a las ' + pad(sched.open) + ':00';
      return 'el ' + d.toLocaleDateString('es-MX', { weekday: 'long' }) + ' a las ' + pad(sched.open) + ':00';
    }
    return 'en nuestro próximo horario';
  }

  function updateStatusBadge() {
    var badge = $('#statusBadge');
    if (!badge) return;
    var text = $('.status-text', badge);
    if (!text) return;
    if (isStoreOpenNow()) {
      badge.classList.add('open');
      badge.classList.remove('closed');
      text.textContent = 'Abierto ahora — pasa por tu antojo';
    } else {
      badge.classList.add('closed');
      badge.classList.remove('open');
      text.textContent = 'Cerrado — abrimos ' + nextOpeningText();
    }
  }

  /* ── 2) BOTÓN DE WHATSAPP DE LA VITRINA ──────────────────
     Siempre activo: WhatsApp es asíncrono y contestamos al abrir.
     Solo cambia el texto de apoyo según el horario.
     ------------------------------------------------------- */

  function updateVitrinaButton() {
    var btn  = $('#vitrinaWhatsapp');
    var txt  = $('#vitrinaWhatsappText');
    var note = $('#vitrinaNote');
    if (!btn || !txt) return;

    var abierto = isStoreOpenNow();
    var msg = abierto
      ? '¡Hola Sweet Bakery! Vi la sección de Vitrina en la web. ¿Qué postres tienen disponibles hoy para pasar a recoger?'
      : '¡Hola Sweet Bakery! Vi la sección de Vitrina en la web. Me gustaría apartar algo de la vitrina para cuando abran. ¿Qué tienen disponible?';

    btn.classList.remove('disabled');
    btn.removeAttribute('aria-disabled');
    btn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    txt.textContent = abierto ? 'Pregunta por la vitrina de hoy' : 'Aparta tu antojo por WhatsApp';

    if (note) {
      note.textContent = abierto
        ? 'Estamos abiertos ahora · Lun–Vie 10–19h · Sáb 10–16h · Dom cerrado'
        : 'Escríbenos cuando quieras, te contestamos al abrir (' + nextOpeningText() + ').';
    }
  }

  /* ── 3) BOTONES DE CLÁSICOS ─────────────────────────────── */

  function bindClasicoButtons() {
    $$('[data-product]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var producto = btn.dataset.product;
        var msg = '¡Hola Sweet Bakery! Vi su catálogo en la web y me interesa ' + producto +
                  '. ¿Cuál es la disponibilidad y cómo puedo apartarlo?';
        window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      });
    });
  }

  /* ── 4) NAVBAR ──────────────────────────────────────────── */

  function bindNavbar() {
    var nav = $('#navbar');
    var toggle = $('#navToggle');
    var links = $('.nav-links');
    if (!nav) return;

    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });

    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      });

      $$('.nav-links a').forEach(function (a) {
        a.addEventListener('click', function () {
          links.classList.remove('open');
          toggle.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Abrir menú');
        });
      });

      // Cerrar el menú móvil con Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && links.classList.contains('open')) {
          links.classList.remove('open');
          toggle.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
    }
  }

  /* ── 5) REVEAL ON SCROLL ────────────────────────────────── */

  function bindRevealObserver() {
    var items = $$('.reveal');
    if (!items.length) return;

    // Sin IntersectionObserver no escondemos nada: más vale una página sin
    // animación que una página en blanco.
    if (!('IntersectionObserver' in window)) return;

    // El estado oculto solo existe si de verdad vamos a poder revelarlo.
    document.documentElement.classList.add('anim');

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { obs.observe(el); });

    // Red de seguridad: si por lo que sea el observador no reporta nada
    // (pestaña en segundo plano, navegador que estrangula rAF), a los 2.5 s
    // mostramos todo. Nunca debe quedarse contenido invisible.
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add('in-view'); });
    }, 2500);
  }


  /* ── 6) COTIZADOR ───────────────────────────────────────── */

  var TOTAL_STEPS = 5;
  var currentStep = 1;
  var state = { size: null, tier: 'small', basePrice: 0 };

  function calcTotal() {
    var total = state.basePrice;

    // Relleno cremoso (incluido, pero por si algún día tiene costo)
    var cremoso = $('input[name="cremoso"]:checked');
    if (cremoso) total += Number(cremoso.dataset.price || 0);

    // Rellenos crujientes (varios)
    $$('input[name="crujiente"]:checked').forEach(function (el) {
      total += Number(el.dataset.price || 0);
    });

    // Relleno especial del mes
    $$('input[name="especial"]:checked').forEach(function (el) {
      total += Number(el.dataset.price || 0);
    });

    // Betún (varios acabados)
    $$('input[name="betun"]:checked').forEach(function (el) {
      total += Number(el.dataset.price || 0);
    });

    // Toppers (varios)
    $$('input[name="topper"]:checked').forEach(function (el) {
      total += Number(el.dataset.price || 0);
    });

    // Extras (algunos con cantidad)
    $$('input[name="extra"]:checked').forEach(function (el) {
      var price = Number(el.dataset.price || 0);
      var qty = 1;
      if (el.dataset.quantity) {
        var chip = el.closest('.chip');
        var input = chip && chip.querySelector('.qty-input');
        qty = input ? (Number(input.value) || 1) : 1;
      }
      total += price * qty;
    });

    // Flor natural (una)
    var flor = $('input[name="flor"]:checked');
    if (flor) total += Number(flor.dataset.price || 0);

    // Vela (una)
    var vela = $('input[name="vela"]:checked');
    if (vela) total += Number(vela.dataset.price || 0);

    // Macarons (stepper)
    total += getMacaronQty() * MACARON_PRICE;

    return total;
  }

  function getMacaronQty() {
    var el = document.getElementById('macaronQty');
    return el ? (parseInt(el.value, 10) || 0) : 0;
  }

  function renderTotal() {
    var el = $('#totalAmount');
    if (!el) return;
    el.textContent = formatMoney(calcTotal());
    el.classList.remove('bump');
    void el.offsetWidth; // reinicia la animación
    el.classList.add('bump');
    sincronizarMostrador();
  }

  /* ---- Betún dinámico según el tamaño ---- */

  function renderBetunOptions(tier) {
    var grid = $('#betunGrid');
    var hint = $('#betunHint');
    if (!grid) return;

    var previas = {};
    $$('input[name="betun"]', grid).forEach(function (i) { previas[i.value] = i.checked; });

    var opciones = (BETUN_OPTIONS[tier] || BETUN_OPTIONS.small).concat(BETUN_OPTIONS.fijos);

    grid.innerHTML = opciones.map(function (o) {
      var checked = previas[o.label] ? ' checked' : '';
      return '<label class="chip">' +
               '<input type="checkbox" name="betun" value="' + o.label + '" data-price="' + o.price + '"' + checked + ' />' +
               '<span>' + o.label + ' <small>(+$' + o.price + ')</small></span>' +
             '</label>';
    }).join('');

    if (hint) {
      hint.textContent = tier === 'large'
        ? 'Puedes combinar varios acabados. En Mediano y Grande, Orillas, Vintage y Peludito tienen precio ampliado.'
        : 'Puedes combinar varios acabados para tu pastel.';
    }

    $$('input[name="betun"]', grid).forEach(function (i) {
      i.addEventListener('change', renderTotal);
    });
  }

  /* ---- Tiritas de oblea: precio según tamaño ---- */

  function renderObleaOptions(sizeValue) {
    var grid = $('#obleaGrid');
    if (!grid) return;

    if (!sizeValue || !TIRITAS_OBLEA[sizeValue]) {
      grid.innerHTML = '<p class="field-note">Elige primero el tamaño de tu pastel para ver el precio de las tiritas de oblea.</p>';
      return;
    }

    var previo = $('input[name="extra"][data-oblea]', grid);
    var estaba = previo ? previo.checked : false;
    var precio = TIRITAS_OBLEA[sizeValue];

    grid.innerHTML =
      '<label class="chip">' +
        '<input type="checkbox" name="extra" data-oblea="true" value="Tiritas de oblea (' + sizeValue + ')" data-price="' + precio + '"' + (estaba ? ' checked' : '') + ' />' +
        '<span>Tiritas de oblea <small>(+$' + precio + ' · tamaño ' + sizeValue + ')</small></span>' +
      '</label>';

    $$('input', grid).forEach(function (i) { i.addEventListener('change', renderTotal); });
  }

  /* ---- Navegación de pasos ---- */

  function setStep(n) {
    $$('.step').forEach(function (s) { s.classList.remove('active'); });
    var target = $('.step[data-step="' + n + '"]');
    if (target) target.classList.add('active');

    $$('.step-pill').forEach(function (p) {
      var num = Number(p.dataset.pill);
      p.classList.toggle('active', num === n);
      p.classList.toggle('done', num < n);
    });

    var fill = $('#progressFill');
    if (fill) fill.style.width = ((n - 1) / (TOTAL_STEPS - 1) * 100) + '%';

    var prev = $('#btnPrev'), next = $('#btnNext'), submit = $('#btnSubmit');
    if (prev) prev.disabled = (n === 1);
    if (next) next.classList.toggle('hidden', n === TOTAL_STEPS);
    if (submit) submit.classList.toggle('hidden', n !== TOTAL_STEPS);

    if (n === 5) buildPickupOptions();

    currentStep = n;
    renderTotal();

    // Sube al inicio del cotizador para que no quede fuera de vista
    var wiz = $('.wizard');
    if (wiz) {
      var top = wiz.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function validateStep(step) {
    if (step === 1) {
      if (!$('input[name="size"]:checked')) {
        showToast('Elige un tamaño para tu pastel.');
        return false;
      }
    }
    if (step === 2) {
      var pan = $('#panSelect');
      if (!pan || !pan.value) { showToast('Selecciona el tipo de pan.'); return false; }
      if (!$('input[name="cremoso"]:checked')) { showToast('Elige un relleno cremoso.'); return false; }
    }
    if (step === 3) {
      if (!$('input[name="betun"]:checked')) {
        showToast('Elige al menos un acabado de betún.');
        return false;
      }
    }
    return true;
  }

  /* ---- Fecha y hora de recolección ---- */

  function primeraFechaValida() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + MIN_DAYS_AHEAD);
    // Si cae en un día cerrado (domingo), avanzamos al siguiente día hábil
    var guard = 0;
    while (isClosedDay(d) && guard < 14) {
      d.setDate(d.getDate() + 1);
      guard++;
    }
    return d;
  }

  function buildPickupOptions() {
    var dateInput = $('#pickupDate');
    var timeSelect = $('#pickupTime');
    if (!dateInput || !timeSelect) return;

    var minDate = primeraFechaValida();
    dateInput.min = toLocalISO(minDate);
    if (!dateInput.value) dateInput.value = toLocalISO(minDate);

    if (!dateInput._sbBound) {
      dateInput.addEventListener('change', onDateChange);
      dateInput._sbBound = true;
    }
    onDateChange();
  }

  function onDateChange() {
    var dateInput = $('#pickupDate');
    var help = $('#dateHelp');
    if (!dateInput) return;

    var minDate = primeraFechaValida();
    var picked = parseLocalDate(dateInput.value);

    if (!picked) { refreshTimeOptions(null); return; }

    // Domingo (o cualquier día cerrado) → regresamos a la primera fecha válida
    if (isClosedDay(picked)) {
      dateInput.value = toLocalISO(minDate);
      picked = minDate;
      showToast('Los domingos cerramos. Te movimos al ' + formatPickupDate(minDate) + '.');
    }

    // Antes del mínimo → regresamos al mínimo
    if (picked < minDate) {
      dateInput.value = toLocalISO(minDate);
      picked = minDate;
      showToast('Necesitamos mínimo ' + MIN_DAYS_AHEAD + ' días de anticipación.');
    }

    if (help) {
      help.textContent = 'Recolección el ' + formatPickupDate(picked) + '.';
      help.classList.add('is-ok');
    }

    refreshTimeOptions(picked);
  }

  function refreshTimeOptions(date) {
    var select = $('#pickupTime');
    if (!select) return;

    var previo = select.value;
    select.innerHTML = '<option value="">Selecciona una hora</option>';

    var sched = date ? SCHEDULE[date.getDay()] : null;
    if (!sched) {
      var op = document.createElement('option');
      op.disabled = true;
      op.textContent = 'Cerrado ese día';
      select.appendChild(op);
      return;
    }

    for (var h = sched.open; h < sched.close; h += 0.5) {
      var hh = Math.floor(h);
      var mm = (h % 1 === 0) ? '00' : '30';
      var label = pad(hh) + ':' + mm;
      var opt = document.createElement('option');
      opt.value = label;
      opt.textContent = label + ' hrs';
      select.appendChild(opt);
    }

    // Conservamos la hora si sigue siendo válida
    if (previo && $$('option', select).some(function (o) { return o.value === previo; })) {
      select.value = previo;
    }
  }

  /* ---- Mensaje de WhatsApp ---- */

  function recogerDatos() {
    var size = $('input[name="size"]:checked');
    var pan = $('#panSelect');
    var cremoso = $('input[name="cremoso"]:checked');
    var betun = $$('input[name="betun"]:checked');
    var toppers = $$('input[name="topper"]:checked');
    var flor = $('input[name="flor"]:checked');
    var vela = $('input[name="vela"]:checked');
    var fecha = parseLocalDate($('#pickupDate') ? $('#pickupDate').value : '');

    return {
      size: size,
      pan: pan ? pan.value : '',
      cremoso: cremoso ? cremoso.value : '',
      crujientes: $$('input[name="crujiente"]:checked').map(function (i) { return i.value; }),
      especiales: $$('input[name="especial"]:checked').map(function (i) { return i.value; }),
      betun: betun.map(function (i) { return i.value + ' (+$' + i.dataset.price + ')'; }),
      toppers: toppers.map(function (i) { return i.value; }),
      topperTexto: ($('#topperDetailInput') ? $('#topperDetailInput').value : '').trim(),
      extras: $$('input[name="extra"]:checked').map(function (el) {
        if (el.dataset.quantity) {
          var chip = el.closest('.chip');
          var input = chip && chip.querySelector('.qty-input');
          var qty = input ? (Number(input.value) || 1) : 1;
          return qty > 1 ? el.value + ' x' + qty : el.value;
        }
        return el.value;
      }),
      macarons: getMacaronQty(),
      flor: (flor && flor.value !== 'Sin flor') ? flor.value : null,
      vela: (vela && vela.value !== 'Sin vela') ? vela.value : null,
      fecha: fecha,
      fechaTexto: fecha ? capitalize(formatPickupDate(fecha)) : '(sin fecha)',
      hora: $('#pickupTime') ? $('#pickupTime').value : '',
      nombre: ($('#customerName') ? $('#customerName').value : '').trim() || 'Cliente Sweet Bakery',
      telefono: ($('#customerPhone') ? $('#customerPhone').value : '').trim(),
      notas: ($('#customerNotes') ? $('#customerNotes').value : '').trim(),
      total: calcTotal()
    };
  }

  function buildWhatsappMessage() {
    var d = recogerDatos();
    var L = [];

    L.push('¡Hola Sweet Bakery! 🎂');
    L.push('Quiero cotizar un pastel personalizado:');
    L.push('');
    L.push('👤 *Nombre:* ' + d.nombre);
    if (d.telefono) L.push('📱 *WhatsApp:* ' + d.telefono);
    L.push('');
    L.push('🎂 *PASTEL*');
    L.push('• Tamaño: ' + (d.size ? d.size.value + ' ($' + d.size.dataset.price + ')' : '—'));
    L.push('• Pan: ' + (d.pan || '—'));
    L.push('• Relleno cremoso: ' + (d.cremoso || '—'));
    L.push('• Color del betún: ' + colorElegido.nombre);
    if (d.crujientes.length) L.push('• Relleno crujiente: ' + d.crujientes.join(', '));
    if (d.especiales.length) L.push('• Relleno especial: ' + d.especiales.join(', '));

    if (d.betun.length) {
      L.push('');
      L.push('🍥 *BETÚN*');
      d.betun.forEach(function (b) { L.push('• ' + b); });
    }

    if (d.toppers.length) {
      L.push('');
      L.push('🎀 *TOPPERS*');
      d.toppers.forEach(function (t) { L.push('• ' + t); });
      if (d.topperTexto) L.push('• Texto: "' + d.topperTexto + '"');
    }

    if (d.extras.length || d.macarons > 0 || d.flor || d.vela) {
      L.push('');
      L.push('✨ *EXTRAS Y DECORACIÓN*');
      d.extras.forEach(function (e) { L.push('• ' + e); });
      if (d.macarons > 0) L.push('• Macarons x' + d.macarons + ' (+' + formatMoney(d.macarons * MACARON_PRICE) + ')');
      if (d.flor) L.push('• ' + d.flor);
      if (d.vela) L.push('• ' + d.vela);
    }

    L.push('');
    L.push('📅 *RECOLECCIÓN EN TIENDA*');
    L.push('• Fecha: ' + d.fechaTexto);
    L.push('• Hora: ' + (d.hora ? d.hora + ' hrs' : '(sin hora)'));
    L.push('• Sucursal: Calle 24 #2104, Chihuahua, Chih.');

    if (d.notas) {
      L.push('');
      L.push('📝 *Notas:* ' + d.notas);
    }

    L.push('');
    L.push('💰 *TOTAL ESTIMADO: ' + formatMoney(d.total) + '*');
    L.push('');
    L.push('Quedo al pendiente para confirmar y dejar el anticipo. ¡Gracias! 💕');

    return L.join('\n');
  }

  /* ---- Vista previa dentro del cotizador ---- */



  /* ---- Enlaces del cotizador ---- */

  function bindWizard() {
    var wizard = $('.wizard');
    if (!wizard) return;

    // Tamaño → recalcula betún, oblea y total
    $$('input[name="size"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        state.basePrice = Number(radio.dataset.price || 0);
        state.tier = radio.dataset.tier || 'small';
        state.size = radio.value;
        renderBetunOptions(state.tier);
        renderObleaOptions(state.size);
        renderTotal();
      });
    });

    // Cualquier cambio de precio dentro del cotizador
    wizard.addEventListener('change', function (e) {
      var el = e.target;
      var nombres = ['cremoso', 'crujiente', 'especial', 'extra', 'flor', 'betun', 'topper', 'vela', 'pan'];
      if (nombres.indexOf(el.name) > -1) renderTotal();

      // Habilita/deshabilita el contador de los extras con cantidad
      if (el.name === 'extra' && el.dataset.quantity) {
        var chip = el.closest('.chip');
        var qty = chip && chip.querySelector('.qty-input');
        if (qty) {
          qty.disabled = !el.checked;
          if (el.checked && !qty.value) qty.value = 1;
        }
        renderTotal();
      }

      if (el.name === 'topper') updateTopperDetail();
    });

    wizard.addEventListener('input', function (e) {
      if (e.target.id === 'topperDetailInput') sincronizarMostrador();
      if (e.target.classList.contains('qty-input')) {
        var v = parseInt(e.target.value, 10);
        var max = Number(e.target.max) || 99;
        if (isNaN(v) || v < 1) v = 1;
        if (v > max) v = max;
        e.target.value = v;
        renderTotal();
      }
    });

    // Evita que al escribir la cantidad se marque/desmarque el chip
    $$('.qty-input').forEach(function (q) {
      q.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    // Navegación
    var next = $('#btnNext'), prev = $('#btnPrev'), submit = $('#btnSubmit');
    if (next) next.addEventListener('click', function () {
      if (currentStep < TOTAL_STEPS && validateStep(currentStep)) setStep(currentStep + 1);
    });
    if (prev) prev.addEventListener('click', function () {
      if (currentStep > 1) setStep(currentStep - 1);
    });

    // Permite saltar a un paso ya visitado desde la barra de progreso
    $$('.step-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var n = Number(pill.dataset.pill);
        if (n < currentStep) setStep(n);
      });
    });

    if (submit) submit.addEventListener('click', function () {
      var nombre = ($('#customerName') ? $('#customerName').value : '').trim();
      var fecha = $('#pickupDate') ? $('#pickupDate').value : '';
      var hora = $('#pickupTime') ? $('#pickupTime').value : '';
      if (!nombre) { showToast('Escribe tu nombre para poder identificar tu pedido.'); focusEl('#customerName'); return; }
      if (!fecha) { showToast('Elige una fecha de recolección.'); focusEl('#pickupDate'); return; }
      if (!hora) { showToast('Elige una hora de recolección.'); focusEl('#pickupTime'); return; }
      showQuoteModal();
    });

    // Estado inicial
    renderBetunOptions('small');
    renderObleaOptions(null);
    setStepSilent(1);
  }

  function focusEl(sel) { var el = $(sel); if (el) el.focus(); }

  // Como setStep() hace scroll, en el arranque usamos una versión sin scroll
  function setStepSilent(n) {
    $$('.step').forEach(function (s) { s.classList.toggle('active', Number(s.dataset.step) === n); });
    $$('.step-pill').forEach(function (p) {
      var num = Number(p.dataset.pill);
      p.classList.toggle('active', num === n);
      p.classList.toggle('done', num < n);
    });
    var fill = $('#progressFill');
    if (fill) fill.style.width = ((n - 1) / (TOTAL_STEPS - 1) * 100) + '%';
    var prev = $('#btnPrev'), next = $('#btnNext'), submit = $('#btnSubmit');
    if (prev) prev.disabled = true;
    if (next) next.classList.remove('hidden');
    if (submit) submit.classList.add('hidden');
    currentStep = n;
    renderTotal();
  }

  /* ── 7) TOPPER: campo de texto ──────────────────────────── */

  function updateTopperDetail() {
    var seleccionados = $$('input[name="topper"]:checked');
    var detail = document.getElementById('topperDetail');
    var label = document.getElementById('topperDetailLabel');
    var input = document.getElementById('topperDetailInput');
    var hint = document.getElementById('topperDetailHint');
    if (!detail) return;

    var necesitaNombre = seleccionados.some(function (t) { return t.value.indexOf('Nombre') > -1; });
    var necesitaNumero = seleccionados.some(function (t) { return t.value.indexOf('Número') > -1; });

    if (!necesitaNombre && !necesitaNumero) {
      detail.classList.remove('visible');
      if (input) input.value = '';
      return;
    }

    detail.classList.add('visible');

    if (necesitaNombre && necesitaNumero) {
      if (label) label.textContent = '¿Qué nombre y número llevarán tus toppers?';
      if (input) input.placeholder = 'Ej. Sofía · 15';
      if (hint) hint.textContent = 'Escríbelos tal como los quieres sobre el pastel.';
    } else if (necesitaNombre) {
      if (label) label.textContent = '¿Qué nombre llevará el topper?';
      if (input) input.placeholder = 'Ej. María, Carlos, Sofía…';
      if (hint) hint.textContent = 'Máx. 60 caracteres · tal como lo quieres escrito.';
    } else {
      if (label) label.textContent = '¿Qué número llevará el topper?';
      if (input) input.placeholder = 'Ej. 15, 18, 50…';
      if (hint) hint.textContent = 'Número de años, fecha o cualquier cifra.';
    }
  }

  /* ── 8) MACARONS (stepper) ──────────────────────────────── */

  window.changeMacarons = function (delta) {
    var countEl = document.getElementById('macaronCount');
    var qtyInput = document.getElementById('macaronQty');
    var minusBtn = document.getElementById('macaronMinus');
    var plusBtn = document.getElementById('macaronPlus');
    var priceTag = document.getElementById('macaronPriceTag');
    if (!countEl || !qtyInput) return;

    var current = parseInt(countEl.textContent, 10) || 0;
    current = Math.min(MACARON_MAX, Math.max(0, current + delta));
    countEl.textContent = current;
    qtyInput.value = current;

    if (minusBtn) minusBtn.disabled = (current === 0);
    if (plusBtn) plusBtn.disabled = (current === MACARON_MAX);

    if (priceTag) {
      priceTag.textContent = formatMoney(current * MACARON_PRICE);
      priceTag.style.display = current > 0 ? '' : 'none';
    }

    renderTotal();
  };

  /* ── 9) TOAST ───────────────────────────────────────────── */

  function showToast(msg, type) {
    var toast = document.getElementById('validationToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'validation-toast visible' + (type === 'success' ? ' toast-success' : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.className = 'validation-toast'; }, 3600);
  }

  /* ── 10) MODAL DE RESUMEN ───────────────────────────────── */

  var _modalPrevFocus = null;

  function showQuoteModal() {
    var modal = document.getElementById('quoteModal');
    var body = document.getElementById('quoteModalBody');
    var totalEl = document.getElementById('quoteModalTotal');
    if (!modal || !body) return;

    var d = recogerDatos();
    var rows = [];

    if (d.size) rows.push(['Tamaño', d.size.value + ' · ' + formatMoney(Number(d.size.dataset.price))]);
    if (d.pan) rows.push(['Pan', d.pan]);
    if (d.cremoso) rows.push(['Relleno cremoso', d.cremoso]);
    rows.push(['Color del betún', colorElegido.nombre]);
    if (d.crujientes.length) rows.push(['Relleno crujiente', d.crujientes.join(', ')]);
    if (d.especiales.length) rows.push(['Relleno especial', d.especiales.join(', ')]);
    if (d.betun.length) rows.push(['Betún', d.betun.join(', ')]);
    if (d.toppers.length) rows.push(['Toppers', d.toppers.join(', ') + (d.topperTexto ? ' — "' + d.topperTexto + '"' : '')]);

    var extrasTexto = d.extras.slice();
    if (d.macarons > 0) extrasTexto.push('Macarons x' + d.macarons);
    if (extrasTexto.length) rows.push(['Extras', extrasTexto.join(', ')]);
    if (d.flor) rows.push(['Flor natural', d.flor]);
    if (d.vela) rows.push(['Vela', d.vela]);

    rows.push(['Fecha', d.fechaTexto]);
    if (d.hora) rows.push(['Hora', d.hora + ' hrs']);
    rows.push(['Nombre', d.nombre]);
    if (d.telefono) rows.push(['WhatsApp', d.telefono]);
    if (d.notas) rows.push(['Notas', d.notas]);

    body.innerHTML = rows.map(function (r) {
      return '<div class="quote-row"><span class="quote-row-label">' + escapeHtml(r[0]) +
             '</span><span class="quote-row-value">' + escapeHtml(r[1]) + '</span></div>';
    }).join('');

    if (totalEl) totalEl.textContent = formatMoney(d.total);

    _modalPrevFocus = document.activeElement;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    var confirmBtn = document.getElementById('quoteModalConfirm');
    var cancelBtn = document.getElementById('quoteModalCancel');
    var closeBtn = document.getElementById('quoteModalClose');

    if (closeBtn) closeBtn.onclick = closeQuoteModal;
    if (cancelBtn) cancelBtn.onclick = closeQuoteModal;
    if (confirmBtn) {
      confirmBtn.onclick = function () {
        closeQuoteModal();
        window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildWhatsappMessage()),
                    '_blank', 'noopener');
      };
      confirmBtn.focus();
    }

    modal.onclick = function (e) { if (e.target === modal) closeQuoteModal(); };
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeQuoteModal() {
    var modal = document.getElementById('quoteModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKeydown);
    if (_modalPrevFocus && _modalPrevFocus.focus) _modalPrevFocus.focus();
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') closeQuoteModal();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── 11) GALERÍA FILTRABLE ──────────────────────────────── */

  function bindGaleriaFilter() {
    var botones = $$('.filter-btn');
    var items = $$('.galeria-item');
    if (!botones.length || !items.length) return;

    botones.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filtro = btn.getAttribute('data-filter');
        botones.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        var visibles = 0;
        items.forEach(function (item) {
          var cat = item.getAttribute('data-cat');
          var mostrar = (filtro === 'all' || cat === filtro);
          item.classList.toggle('hidden', !mostrar);
          if (mostrar) visibles++;
        });

        var vacio = document.getElementById('galeriaEmpty');
        if (vacio) vacio.classList.toggle('hidden', visibles > 0);
      });
    });
  }

  /* ── 12) SABOR DEL MES ──────────────────────────────────── */

  function initSaborMes() {
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var ahora = new Date();
    var mesActual = meses[ahora.getMonth()];

    var nombreEl = document.getElementById('saborMesNombre');
    var descEl = document.getElementById('saborMesDesc');
    var mesEl = document.getElementById('saborMesMes');
    var ribbon = document.getElementById('saborMesRibbon');

    if (nombreEl && SABOR_MES.nombre) nombreEl.textContent = SABOR_MES.nombre;
    if (descEl && SABOR_MES.descripcion) descEl.textContent = SABOR_MES.descripcion;
    if (mesEl) mesEl.textContent = mesActual;
    if (ribbon) ribbon.textContent = (mesActual + ' ' + ahora.getFullYear()).toUpperCase();
  }

  /* ── 12b) TEMPORADAS ────────────────────────────────────
     Arma el botón de WhatsApp de cada temporada y marca cuál
     está activa o cuál sigue, para que la sección no envejezca.
     ------------------------------------------------------- */

  function initTemporadas() {
    var tarjetas = $$('.temporada-card');
    if (!tarjetas.length) return;

    var mesHoy = new Date().getMonth() + 1; // 1-12

    // ¿Cuántos meses faltan para que empiece esta temporada?
    function mesesFaltantes(inicio) {
      var d = inicio - mesHoy;
      return d < 0 ? d + 12 : d;
    }

    var siguiente = null;
    var menorEspera = 99;

    tarjetas.forEach(function (card) {
      var inicio = Number(card.dataset.mesInicio);
      var fin = Number(card.dataset.mesFin);
      var activa = (mesHoy >= inicio && mesHoy <= fin);

      if (activa) {
        card.classList.add('es-activa');
        var e = $('[data-estado]', card);
        if (e) { e.textContent = 'Disponible ahora'; e.classList.add('activa'); }
      } else {
        var espera = mesesFaltantes(inicio);
        if (espera < menorEspera) { menorEspera = espera; siguiente = card; }
      }

      // Botón de aviso con el mensaje ya escrito
      var cta = $('.temporada-cta', card);
      if (cta) {
        var que = cta.dataset.avisar || card.dataset.temporada;
        var msg = activa
          ? '¡Hola Sweet Bakery! Vi en la web que ya tienen ' + que + '. ¿Qué opciones y precios manejan?'
          : '¡Hola Sweet Bakery! Quiero que me avisen en cuanto abran pedidos de ' + que + '. ¿Me anotan en la lista?';
        cta.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
        if (activa) {
          var t = $('span:not([class])', cta) || cta.querySelector('span:last-child');
          if (t) t.textContent = 'Pedir ahora';
        }
      }
    });

    // Si ninguna está activa, señalamos la que viene
    if (siguiente && !$('.temporada-card.es-activa')) {
      siguiente.classList.add('es-proxima');
      var el = $('[data-estado]', siguiente);
      if (el) {
        el.textContent = menorEspera <= 1 ? 'Próximamente' : 'Siguiente temporada';
        el.classList.add('proxima');
      }
    }
  }

  /* ── 13) LINK ACTIVO EN EL MENÚ ─────────────────────────── */

  function bindActiveNavLink() {
    var secciones = $$('section[id], footer[id]');
    var links = $$('.nav-links a');
    if (!secciones.length || !links.length) return;
    if (!('IntersectionObserver' in window)) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { threshold: 0.35 });

    secciones.forEach(function (s) { obs.observe(s); });
  }

  /* ── 14) SCROLL SUAVE ───────────────────────────────────── */

  function bindSmoothScroll() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
        if (history.replaceState) history.replaceState(null, '', href);
      });
    });
  }

  /* ── 15) AÑO EN EL PIE ──────────────────────────────────── */

  var ANO_FUNDACION = 2017;

  function setYear() {
    var ahora = new Date().getFullYear();
    var el = $('#year');
    if (el) el.textContent = ahora;
    var anos = $('#anosActivos');
    if (anos) anos.textContent = ahora - ANO_FUNDACION;
    var anos2 = $('#confianzaAnos');
    if (anos2) anos2.textContent = ahora - ANO_FUNDACION;
  }

  /* ── ARRANQUE ───────────────────────────────────────────── */

  /* ── 15b) ENTRADA ESCALONADA ─────────────────────────────
     Numera los hijos de cada rejilla para que el CSS los haga
     aparecer uno tras otro en vez de todos de golpe.
     ------------------------------------------------------- */

  function initEscalonado() {
    var rejillas = ['.segmentos-grid', '.temporadas-grid', '.clasicos-grid',
                    '.vitrina-grid', '.politica-grid'];
    rejillas.forEach(function (sel) {
      $$(sel + ' > *').forEach(function (el, i) {
        el.style.setProperty('--i', Math.min(i, 8));
      });
    });
  }

  /* ── 15c) BARRA DE ACCIÓN FIJA (móvil) ───────────────────
     Aparece una vez que el hero quedó atrás y se esconde al
     llegar al pie, para no tapar los datos de contacto.
     ------------------------------------------------------- */

  function initBarraAccion() {
    var barra = $('#barraAccion');
    var pie = $('#contacto');
    if (!barra) return;

    // La barra ya se ve por CSS. Lo único que hace el JS es quitarla de
    // en medio cuando el usuario llega al pie, donde están los contactos.
    barra.setAttribute('aria-hidden', 'false');
    if (!pie || !('IntersectionObserver' in window)) return;

    new IntersectionObserver(function (entradas) {
      var enPie = entradas[0].isIntersecting;
      barra.classList.toggle('oculta', enPie);
      barra.setAttribute('aria-hidden', String(enPie));
    }, { rootMargin: '0px 0px -25% 0px' }).observe(pie);
  }



  /* ══════════════ EL MOSTRADOR ══════════════
     Tres piezas que viven juntas: el color del betún, el pastel que se
     dibuja solo y el ticket desglosado. Nada de fotos: SVG en la paleta
     de la casa, para que combine con el resto del sitio.
     ──────────────────────────────────────── */

  /* ── Colores de betún. Sin costo: la lista de precios no los cobra. ── */
  var COLORES = [
    { id: 'crema',    nombre: 'Crema',         hex: '#F3E5D5', borde: '#E0CDB8' },
    { id: 'blanco',   nombre: 'Blanco',        hex: '#FBF7F3', borde: '#E6DED5' },
    { id: 'rosa',     nombre: 'Rosa',          hex: '#EFC2C9', borde: '#D9A2AB' },
    { id: 'durazno',  nombre: 'Durazno',       hex: '#F1BE9F', borde: '#D9A182' },
    { id: 'salvia',   nombre: 'Verde salvia',  hex: '#B7C4AB', borde: '#9AAA8D' },
    { id: 'matcha',   nombre: 'Verde matcha',  hex: '#9DAE8A', borde: '#84956F' },
    { id: 'cielo',    nombre: 'Azul cielo',    hex: '#BBD2E2', borde: '#9DB8CB' },
    { id: 'marino',   nombre: 'Azul marino',   hex: '#43506B', borde: '#333E55' },
    { id: 'borgona',  nombre: 'Borgoña',       hex: '#8C3344', borde: '#6E2635' },
    { id: 'chocolate',nombre: 'Chocolate',     hex: '#6E4C3C', borde: '#573A2D' }
  ];

  var colorElegido = COLORES[0];

  // Proporciones del pastel por tamaño, dentro de un lienzo de 320×300
  var FORMAS = {
    'Lunchbox': { w: 116, h: 64 },
    'Pequeño':  { w: 146, h: 92 },
    'Chico':    { w: 168, h: 108 },
    'Mediano':  { w: 192, h: 124 },
    'Grande':   { w: 212, h: 140 }
  };

  function aclarar(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * k);
    g = Math.round(g + (255 - g) * k);
    b = Math.round(b + (255 - b) * k);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function oscurecer(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.round(((n >> 16) & 255) * (1 - k));
    var g = Math.round(((n >> 8) & 255) * (1 - k));
    var b = Math.round((n & 255) * (1 - k));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function pintarColores() {
    var grid = $('#coloresGrid');
    if (!grid) return;
    grid.innerHTML = COLORES.map(function (c, i) {
      return '<button type="button" class="color-opcion' + (i === 0 ? ' activo' : '') + '"' +
             ' data-color="' + c.id + '" role="radio" aria-checked="' + (i === 0) + '"' +
             ' title="' + c.nombre + '" aria-label="Betún color ' + c.nombre + '">' +
             '<span class="color-muestra" style="background:' + c.hex + ';border-color:' + c.borde + '"></span>' +
             '<span class="color-nombre">' + c.nombre + '</span></button>';
    }).join('');

    $$('.color-opcion', grid).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.color-opcion', grid).forEach(function (o) {
          o.classList.remove('activo');
          o.setAttribute('aria-checked', 'false');
        });
        b.classList.add('activo');
        b.setAttribute('aria-checked', 'true');
        colorElegido = COLORES.filter(function (c) { return c.id === b.dataset.color; })[0] || COLORES[0];
        confirmar('Betún ' + colorElegido.nombre.toLowerCase());
        dibujarPastel();
      });
    });
  }

  /* ── El pastel ─────────────────────────────────────────── */

  function elegidos(nombre) {
    return $$('[name="' + nombre + '"]:checked').map(function (i) { return i.value; });
  }
  function tiene(lista, texto) {
    return lista.some(function (v) { return v.indexOf(texto) > -1; });
  }

  function dibujarPastel() {
    var lienzo = $('#pastelLienzo');
    if (!lienzo) return;

    var size = $('input[name="size"]:checked');
    var forma = FORMAS[size ? size.value : 'Chico'] || FORMAS['Chico'];
    var betun = elegidos('betun');
    var extras = elegidos('extra');
    var toppers = elegidos('topper');
    var flor = $('input[name="flor"]:checked');
    var vela = $('input[name="vela"]:checked');

    var base = colorElegido.hex;
    var luz = aclarar(base, 0.26);
    var oscuro = oscurecer(base, 0.20);
    var tapa = aclarar(base, 0.34);
    var crema = aclarar(base, 0.62);

    var cx = 160, suelo = 250;
    var w = forma.w, h = forma.h;
    var x = cx - w / 2;
    var techo = suelo - h;
    var rx = w / 2, ry = Math.max(10, w * 0.095);

    var cupula = tiene(betun, 'Cúpula');
    // Borde frontal de la tapa: por donde cuelga el dripp y se posan las perlas
    var frente = techo + ry;
    // Altura real de la superficie donde van flores, velas y topper
    var mesa = cupula ? techo - h * 0.22 : techo;

    var o = [];

    // ── Degradados: dan volumen sin cortes duros ──
    o.push('<defs>' +
      '<linearGradient id="pGCuerpo" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="' + luz + '"/>' +
        '<stop offset="0.38" stop-color="' + base + '"/>' +
        '<stop offset="1" stop-color="' + oscuro + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="pGTapa" x1="0" y1="0" x2="0.4" y2="1">' +
        '<stop offset="0" stop-color="' + aclarar(base, 0.46) + '"/>' +
        '<stop offset="1" stop-color="' + tapa + '"/>' +
      '</linearGradient>' +
    '</defs>');

    // ── Plato ──
    o.push('<ellipse cx="' + cx + '" cy="' + (suelo + 10) + '" rx="' + (rx + 32) + '" ry="' + (ry * 0.72) + '" fill="#E7DACB"/>');
    o.push('<ellipse cx="' + cx + '" cy="' + (suelo + 7) + '" rx="' + (rx + 26) + '" ry="' + (ry * 0.62) + '" fill="#F8F1E8"/>');

    // ── Cuerpo ──
    o.push('<path d="M' + x + ' ' + techo + ' L' + x + ' ' + suelo +
           ' A' + rx + ' ' + ry + ' 0 0 0 ' + (x + w) + ' ' + suelo +
           ' L' + (x + w) + ' ' + techo + ' Z" fill="url(#pGCuerpo)"/>');

    // ── Peludito: textura vertical sobre el cuerpo ──
    if (tiene(betun, 'Peludito')) {
      var t = '';
      for (var k = 0; k * 7 < w - 6; k++) {
        var px = x + 5 + k * 7;
        t += '<path d="M' + px + ' ' + (techo + ry * 0.4) + ' q3.5 ' + (h * 0.34) + ' 0 ' + (h * 0.74) +
             '" stroke="' + oscuro + '" stroke-width="2.4" fill="none" opacity="0.26" stroke-linecap="round"/>';
      }
      o.push(t);
    }

    // ── Dibujo pintado a mano, sobre el cuerpo ──
    if (tiene(betun, 'Dibujo')) {
      var cuantos = tiene(betun, 'elaborado') ? 7 : 4;
      var trazo = oscurecer(base, 0.40);
      var dib = '';
      for (var f = 0; f < cuantos; f++) {
        var fx = x + w * (0.16 + 0.68 * (f / Math.max(1, cuantos - 1)));
        var fy = techo + ry + h * (f % 2 === 0 ? 0.34 : 0.58);
        dib += '<g transform="translate(' + fx.toFixed(1) + ',' + fy.toFixed(1) + ')" opacity="0.66">' +
               '<circle r="3" fill="' + trazo + '"/>' +
               '<circle cx="-5.2" cy="-2.5" r="2.5" fill="' + trazo + '" opacity="0.7"/>' +
               '<circle cx="5.2" cy="-2.5" r="2.5" fill="' + trazo + '" opacity="0.7"/>' +
               '<circle cx="0" cy="5.4" r="2.5" fill="' + trazo + '" opacity="0.7"/></g>';
      }
      o.push(dib);
    }

    // ── Brillos y sprinkles sobre el cuerpo ──
    var brillo = null;
    if (tiene(extras, 'Hoja de oro') || tiene(extras, 'Salpicado') || tiene(extras, 'Pintado completo')) brillo = '#C9A227';
    else if (tiene(extras, 'Glitter')) brillo = '#E7CBDB';
    if (brillo) {
      var sp = '';
      for (var g2 = 0; g2 < 24; g2++) {
        sp += '<circle cx="' + (x + 9 + ((g2 * 53) % Math.max(1, w - 18))) +
              '" cy="' + (frente + 5 + ((g2 * 37) % Math.max(1, h - ry - 12))) +
              '" r="' + (1 + (g2 % 3) * 0.55) + '" fill="' + brillo + '" opacity="0.7"/>';
      }
      o.push(sp);
    }
    if (tiene(extras, 'Sprinkles')) {
      var cols = ['#E4756B', '#E8B04B', '#7FA3C9', '#8FB37C', '#D98CB0'];
      var spr = '';
      for (var p2 = 0; p2 < 22; p2++) {
        var sx = x + 11 + ((p2 * 61) % Math.max(1, w - 22));
        var sy = frente + 7 + ((p2 * 43) % Math.max(1, h - ry - 14));
        spr += '<rect x="' + sx + '" y="' + sy + '" width="5.4" height="2" rx="1" fill="' + cols[p2 % cols.length] +
               '" opacity="0.88" transform="rotate(' + ((p2 * 47) % 180) + ' ' + sx + ' ' + sy + ')"/>';
      }
      o.push(spr);
    }

    // ── Tapa ──
    if (cupula) {
      o.push('<path d="M' + x + ' ' + techo + ' Q' + cx + ' ' + (techo - h * 0.46) + ' ' + (x + w) + ' ' + techo +
             ' A' + rx + ' ' + ry + ' 0 0 1 ' + x + ' ' + techo + ' Z" fill="url(#pGTapa)"/>');
    } else {
      o.push('<ellipse cx="' + cx + '" cy="' + techo + '" rx="' + rx + '" ry="' + ry + '" fill="url(#pGTapa)"/>');
    }

    // ── Dripp: cuelga del borde frontal y escurre hacia abajo ──
    if (tiene(betun, 'Dripp')) {
      var gotas = Math.max(5, Math.round(w / 24));
      var d = 'M' + x + ' ' + techo;
      // baja por el borde frontal izquierdo
      d += ' L' + x + ' ' + (techo + 4);
      for (var i = 0; i < gotas; i++) {
        var x1 = x + (w / gotas) * i;
        var x2 = x + (w / gotas) * (i + 1);
        var medio = (x1 + x2) / 2;
        // cuánto escurre cada gota: alterna para que no quede parejo
        var largo = ry + 10 + ((i % 3) * 13) + h * 0.06;
        d += ' Q' + medio + ' ' + (techo + largo) + ' ' + x2 + ' ' + (techo + 4);
      }
      d += ' L' + (x + w) + ' ' + techo +
           ' A' + rx + ' ' + ry + ' 0 0 1 ' + x + ' ' + techo + ' Z';
      o.push('<path d="' + d + '" fill="' + crema + '"/>');
    }

    // ── Orillas: perlas sobre el arco FRONTAL de la tapa y de la base ──
    if (tiene(betun, 'Orillas')) {
      var perlas = '';
      var n = Math.max(6, Math.round(w / 12));
      var r1 = w * 0.032;
      for (var j = 0; j <= n; j++) {
        var tt = (Math.PI / n) * j;              // 0 → π recorre el frente
        perlas += '<circle cx="' + (cx + Math.cos(tt) * rx).toFixed(1) +
                  '" cy="' + (techo + Math.sin(tt) * ry).toFixed(1) +
                  '" r="' + r1.toFixed(1) + '" fill="' + crema + '"/>';
        perlas += '<circle cx="' + (cx + Math.cos(tt) * rx).toFixed(1) +
                  '" cy="' + (suelo + Math.sin(tt) * ry * 0.9).toFixed(1) +
                  '" r="' + r1.toFixed(1) + '" fill="' + aclarar(base, 0.5) + '"/>';
      }
      o.push(perlas);
    }

    // ── Vintage: rosetones en el arco frontal de la tapa ──
    if (tiene(betun, 'Vintage')) {
      var ros = '';
      var m = Math.max(4, Math.round(w / 24));
      for (var q = 0; q <= m; q++) {
        var tq = (Math.PI / m) * q;
        var rxp = cx + Math.cos(tq) * rx;
        var ryp = techo + Math.sin(tq) * ry;
        ros += '<g transform="translate(' + rxp.toFixed(1) + ',' + ryp.toFixed(1) + ')">' +
               '<circle r="' + (w * 0.05).toFixed(1) + '" fill="' + crema + '"/>' +
               '<circle r="' + (w * 0.026).toFixed(1) + '" fill="' + base + '" opacity="0.45"/></g>';
      }
      o.push(ros);
    }

    // ── Fruta sobre la mesa del pastel ──
    if (tiene(extras, 'Cerezas')) {
      o.push('<g><circle cx="' + (cx - 30) + '" cy="' + (mesa - 3) + '" r="6.2" fill="#C3283C"/>' +
        '<circle cx="' + (cx - 30) + '" cy="' + (mesa - 5) + '" r="2" fill="#fff" opacity="0.3"/>' +
        '<circle cx="' + (cx - 16) + '" cy="' + (mesa + 1) + '" r="5.2" fill="#A81F31"/>' +
        '<path d="M' + (cx - 30) + ' ' + (mesa - 9) + ' q5 -8 13 -8" stroke="#6F8268" stroke-width="1.6" fill="none"/></g>');
    }
    if (tiene(extras, 'Berries')) {
      var bs = '';
      [[-34, 1, 5.2, '#B3324F'], [-19, -2, 4.4, '#55304B'], [-5, 0, 4.8, '#C13A54']].forEach(function (b2) {
        bs += '<circle cx="' + (cx + b2[0]) + '" cy="' + (mesa - 2 + b2[1]) + '" r="' + b2[2] + '" fill="' + b2[3] + '"/>';
      });
      o.push('<g>' + bs + '</g>');
    }
    if (tiene(extras, 'Ferrero') || tiene(extras, 'Rafaello')) {
      var dor = tiene(extras, 'Ferrero') ? '#B8893F' : '#F0E6D8';
      o.push('<circle cx="' + (cx + 34) + '" cy="' + (mesa - 1) + '" r="6.2" fill="' + dor + '"/>' +
             '<circle cx="' + (cx + 34) + '" cy="' + (mesa - 3) + '" r="2.2" fill="#fff" opacity="0.45"/>');
    }

    // ── Flor natural: ramo a la izquierda, para no pelear con las velas ──
    if (flor && flor.value !== 'Sin flor') {
      var v = flor.value, ramo;
      if (v.indexOf('Tulipanes') > -1)      ramo = [['#E0607E', 5], ['#F2A7B8', 4.4], ['#C94B6B', 5]];
      else if (v.indexOf('Anturios') > -1)  ramo = [['#C3283C', 5.4], ['#E06A58', 4.4]];
      else if (v.indexOf('Mucha') > -1)     ramo = [['#E07A94', 5], ['#F2C14E', 4], ['#B7C4AB', 4.6], ['#D98CB0', 4], ['#E8A87C', 4.4]];
      else                                  ramo = [['#E07A94', 6], ['#F2C14E', 5]];

      var anchoRamo = (ramo.length - 1) * 16;
      var inicio = cx - 26 - anchoRamo / 2;
      var fl = '';
      ramo.forEach(function (r2, idx) {
        var fx2 = inicio + idx * 16;
        var fy2 = mesa - 17 - (idx % 2) * 11;
        fl += '<path d="M' + fx2 + ' ' + (mesa - 1) + ' Q' + (fx2 + 4) + ' ' + (fy2 + 8) + ' ' + fx2 + ' ' + fy2 +
              '" stroke="#6F8268" stroke-width="2" fill="none" stroke-linecap="round"/>';
        for (var pet = 0; pet < 5; pet++) {
          var pa = (Math.PI * 2 / 5) * pet - Math.PI / 2;
          fl += '<ellipse cx="' + (fx2 + Math.cos(pa) * r2[1] * 0.95).toFixed(1) +
                '" cy="' + (fy2 + Math.sin(pa) * r2[1] * 0.95).toFixed(1) +
                '" rx="' + (r2[1] * 0.82).toFixed(1) + '" ry="' + (r2[1] * 0.62).toFixed(1) +
                '" fill="' + r2[0] + '" transform="rotate(' + (pet * 72) + ' ' +
                (fx2 + Math.cos(pa) * r2[1] * 0.95).toFixed(1) + ' ' + (fy2 + Math.sin(pa) * r2[1] * 0.95).toFixed(1) + ')"/>';
        }
        fl += '<circle cx="' + fx2 + '" cy="' + fy2 + '" r="' + (r2[1] * 0.46).toFixed(1) + '" fill="#F4DFA8"/>';
      });
      o.push('<g>' + fl + '</g>');
    }

    // ── Velas: a la derecha ──
    if (vela && vela.value !== 'Sin vela') {
      var bengala = vela.value.indexOf('engala') > -1;
      var cuantas = vela.value.indexOf('úmero') > -1 ? 2 : 3;
      var centroVelas = cx + 30;
      var vel = '';
      for (var c2 = 0; c2 < cuantas; c2++) {
        var vx = centroVelas - (cuantas - 1) * 15 / 2 + c2 * 15;
        var alto = 30 + (c2 % 2) * 4;
        var vTop = mesa - alto;
        vel += '<rect x="' + (vx - 2.1) + '" y="' + vTop + '" width="4.2" height="' + alto + '" rx="2.1" fill="#FBF3E6" stroke="' + oscurecer(base, 0.18) + '" stroke-width="0.7"/>';
        vel += '<rect x="' + (vx - 2.1) + '" y="' + (vTop + alto * 0.34) + '" width="4.2" height="3" fill="' + colorElegido.borde + '" opacity="0.5"/>';
        if (bengala) {
          for (var ch = 0; ch < 8; ch++) {
            var ca = -Math.PI / 2 + (Math.PI / 7) * (ch - 3.5);
            vel += '<line x1="' + vx + '" y1="' + (vTop - 1) + '" x2="' + (vx + Math.cos(ca) * 12).toFixed(1) +
                   '" y2="' + (vTop - 1 + Math.sin(ca) * 12).toFixed(1) +
                   '" stroke="#E8B04B" stroke-width="1.4" stroke-linecap="round" opacity="0.92"/>';
          }
          vel += '<circle cx="' + vx + '" cy="' + (vTop - 1) + '" r="2.2" fill="#FBE3A2"/>';
        } else {
          vel += '<ellipse cx="' + vx + '" cy="' + (vTop - 5) + '" rx="2.7" ry="4.6" fill="#F2A93B"/>' +
                 '<ellipse cx="' + vx + '" cy="' + (vTop - 4) + '" rx="1.2" ry="2.3" fill="#FBE3A2"/>';
        }
      }
      o.push('<g>' + vel + '</g>');
    }

    // ── Topper al centro, por encima de todo ──
    if (toppers.length) {
      var acrilico = tiene(toppers, 'Acrílico');
      var cart = tiene(toppers, 'Cartoncillo');
      var texto = ($('#topperDetailInput') ? $('#topperDetailInput').value : '').trim();
      if (!texto) texto = tiene(toppers, 'Cruz') ? '✝' : (cart ? 'Feliz día' : 'Tu texto');
      if (texto.length > 16) texto = texto.slice(0, 16) + '…';
      var tintaTop = acrilico ? '#A98247' : (cart ? '#8C3344' : '#7A5C42');
      var yTexto = mesa - 56;
      o.push('<line x1="' + cx + '" y1="' + (mesa - 2) + '" x2="' + cx + '" y2="' + (yTexto + 7) + '" stroke="' + tintaTop + '" stroke-width="1.6"/>');
      o.push('<text x="' + cx + '" y="' + yTexto + '" text-anchor="middle" font-family="Great Vibes, cursive" font-size="23" fill="' + tintaTop + '">' +
             escapeHtml(texto) + '</text>');
    }

    // ── Macarons al pie ──
    var macs = getMacaronQty();
    if (macs > 0) {
      var mc = ['#F2C9D4', '#F6DDA8', '#C9DCC2', '#E8C3A8', '#D9C2E0', '#F2B8A8'];
      var mm = '';
      for (var m2 = 0; m2 < macs; m2++) {
        var mx = cx - (macs - 1) * 21 / 2 + m2 * 21;
        mm += '<g transform="translate(' + mx.toFixed(1) + ',' + (suelo + 6) + ')">' +
              '<ellipse rx="9" ry="5.6" cy="-5" fill="' + mc[m2 % mc.length] + '"/>' +
              '<rect x="-9" y="-2.8" width="18" height="3.2" rx="1.2" fill="#FBF3E6"/>' +
              '<ellipse rx="9" ry="5.6" cy="2.6" fill="' + mc[m2 % mc.length] + '"/></g>';
      }
      o.push('<g>' + mm + '</g>');
    }

    lienzo.innerHTML =
      '<svg viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + o.join('') + '</svg>';

    // Resumen en texto: también es el alt para lectores de pantalla
    var partes = [];
    if (size) partes.push('Pastel ' + size.value.toLowerCase());
    partes.push('betún ' + colorElegido.nombre.toLowerCase());
    if (betun.length) partes.push(betun.join(' y ').toLowerCase());
    if (flor && flor.value !== 'Sin flor') partes.push('con flor natural');
    if (toppers.length) partes.push('con topper');
    var res = $('#pastelResumen');
    if (res) res.textContent = size ? (partes.join(' · ') + '.') : 'Empieza eligiendo un tamaño';
  }


  /* ── El ticket desglosado ──────────────────────────────── */

  function lineasDelPedido() {
    var L = [];
    var size = $('input[name="size"]:checked');

    if (size) {
      var porciones = size.closest('label').querySelector('p');
      L.push({ t: size.value, d: porciones ? porciones.textContent : '', p: Number(size.dataset.price) });
    }

    var pan = $('#panSelect');
    if (pan && pan.value) L.push({ t: 'Pan de ' + pan.value.toLowerCase(), d: '', p: 0 });

    L.push({ t: 'Betún ' + colorElegido.nombre.toLowerCase(), d: '', p: 0 });

    var cremoso = $('input[name="cremoso"]:checked');
    if (cremoso) L.push({ t: cremoso.value, d: '', p: 0 });

    $$('input[name="crujiente"]:checked').forEach(function (i) {
      L.push({ t: i.value, d: 'relleno crujiente', p: Number(i.dataset.price) });
    });
    $$('input[name="especial"]:checked').forEach(function (i) {
      L.push({ t: i.value, d: '', p: Number(i.dataset.price) });
    });
    $$('input[name="betun"]:checked').forEach(function (i) {
      L.push({ t: 'Acabado ' + i.value.toLowerCase(), d: '', p: Number(i.dataset.price) });
    });

    var textoTop = ($('#topperDetailInput') ? $('#topperDetailInput').value : '').trim();
    $$('input[name="topper"]:checked').forEach(function (i) {
      L.push({ t: i.value, d: textoTop ? '«' + textoTop + '»' : '', p: Number(i.dataset.price) });
    });

    $$('input[name="extra"]:checked').forEach(function (i) {
      var qty = 1;
      if (i.dataset.quantity) {
        var chip = i.closest('.chip');
        var inp = chip && chip.querySelector('.qty-input');
        qty = inp ? (Number(inp.value) || 1) : 1;
      }
      L.push({
        t: i.value + (qty > 1 ? ' × ' + qty : ''),
        d: '',
        p: Number(i.dataset.price || 0) * qty
      });
    });

    var macs = getMacaronQty();
    if (macs > 0) L.push({ t: 'Macarons × ' + macs, d: '', p: macs * MACARON_PRICE });

    var flor = $('input[name="flor"]:checked');
    if (flor && flor.value !== 'Sin flor') L.push({ t: flor.value, d: '', p: Number(flor.dataset.price) });

    var vela = $('input[name="vela"]:checked');
    if (vela && vela.value !== 'Sin vela') L.push({ t: vela.value, d: '', p: Number(vela.dataset.price) });

    return L;
  }

  function dibujarTicket() {
    var ul = $('#ticketLineas');
    if (!ul) return;
    var L = lineasDelPedido();

    if (!L.length) {
      ul.innerHTML = '<li class="ticket-vacio">Elige un tamaño y la cuenta se va escribiendo sola.</li>';
      return;
    }

    ul.innerHTML = L.map(function (l) {
      var precio = l.p > 0 ? formatMoney(l.p) : '<span class="ticket-incluido">incluido</span>';
      return '<li class="ticket-linea">' +
               '<span class="ticket-concepto">' + escapeHtml(l.t) +
                 (l.d ? ' <small>' + escapeHtml(l.d) + '</small>' : '') +
               '</span>' +
               '<span class="ticket-precio">' + precio + '</span>' +
             '</li>';
    }).join('');
  }

  /* ── Confirmación con deshacer ─────────────────────────── */

  var _ultimo = null;

  function confirmar(texto, deshacer) {
    var barra = $('#confirmaBarra');
    var txt = $('#confirmaTexto');
    var btn = $('#confirmaDeshacer');
    if (!barra || !txt || !btn) return;

    txt.textContent = texto;
    _ultimo = deshacer || null;
    btn.style.display = _ultimo ? '' : 'none';

    barra.classList.add('visible');
    clearTimeout(barra._t);
    barra._t = setTimeout(function () { barra.classList.remove('visible'); }, 3200);
  }

  function bindDeshacer() {
    var btn = $('#confirmaDeshacer');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (typeof _ultimo === 'function') _ultimo();
      _ultimo = null;
      var barra = $('#confirmaBarra');
      if (barra) barra.classList.remove('visible');
      renderTotal();
    });
  }

  // Avisa de cada elección dentro del cotizador y deja deshacerla
  function bindConfirmaciones() {
    var wizard = $('.wizard');
    if (!wizard) return;
    wizard.addEventListener('change', function (e) {
      var el = e.target;
      if (!el.name) return;
      var nombres = ['cremoso', 'crujiente', 'especial', 'betun', 'topper', 'extra', 'flor', 'vela', 'size'];
      if (nombres.indexOf(el.name) === -1) return;

      var etiqueta = el.value;
      if (el.type === 'checkbox') {
        if (el.checked) {
          confirmar(etiqueta + ' agregado', function () { el.checked = false; sincronizarMostrador(); });
        } else {
          confirmar(etiqueta + ' quitado', function () { el.checked = true; sincronizarMostrador(); });
        }
      } else if (el.type === 'radio' && el.value.indexOf('Sin ') !== 0) {
        confirmar(etiqueta);
      }
    });
  }

  /* ── Un solo punto de actualización ────────────────────── */

  function sincronizarMostrador() {
    dibujarPastel();
    dibujarTicket();
  }


  function init() {
    updateStatusBadge();
    updateVitrinaButton();
    bindClasicoButtons();
    bindNavbar();
    bindRevealObserver();
    bindWizard();
    bindGaleriaFilter();
    initSaborMes();
    initTemporadas();
    bindActiveNavLink();
    bindSmoothScroll();
    setYear();
    updateTopperDetail();
    pintarColores();
    bindDeshacer();
    bindConfirmaciones();
    sincronizarMostrador();
    initEscalonado();
    initBarraAccion();

    // Revisamos el estado del local cada minuto
    setInterval(function () {
      updateStatusBadge();
      updateVitrinaButton();
    }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
