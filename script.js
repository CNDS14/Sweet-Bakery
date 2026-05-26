/* ==========================================================
   SWEET BAKERY · script.js  (v3 — toppers/velas fix)
   ========================================================== */

(function () {
  'use strict';

  /* ── CONFIGURACIÓN ─────────────────────────────────────── */
  const WHATSAPP_NUMBER = '5216142868000'; // WhatsApp Business real
  const MIN_DAYS_AHEAD  = 4;

  const SCHEDULE = {
    0: null,
    1: { open: 10, close: 19 },
    2: { open: 10, close: 19 },
    3: { open: 10, close: 19 },
    4: { open: 10, close: 19 },
    5: { open: 10, close: 19 },
    6: { open: 10, close: 16 }
  };

  /* ── HELPERS ───────────────────────────────────────────── */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const formatMoney = (n) => '$' + Math.round(n).toLocaleString('es-MX');
  const pad = (n) => String(n).padStart(2, '0');
  const toLocalISO = (d) =>
    d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  /* ── 1) ESTADO DEL LOCAL ───────────────────────────────── */
  function isStoreOpenNow() {
    const now   = new Date();
    const sched = SCHEDULE[now.getDay()];
    if (!sched) return false;
    const hours = now.getHours() + now.getMinutes() / 60;
    return hours >= sched.open && hours < sched.close;
  }

  function updateStatusBadge() {
    const badge = $('#statusBadge');
    if (!badge) return;
    const dot  = badge.querySelector('.status-dot');
    const text = badge.querySelector('.status-text');
    const open = isStoreOpenNow();
    badge.classList.toggle('open',   open);
    badge.classList.toggle('closed', !open);
    if (text) text.textContent = open
      ? '\u25CF Abierto ahora \u2014 Pasa por tu antojo'
      : '\u25CB Cerrado por hoy \u2014 Consulta el cat\u00e1logo';
  }

  /* ── 2) BOTÓN VITRINA WHATSAPP ─────────────────────────── */
  function updateVitrinaButton() {
    const btn  = $('#vitrinaWhatsapp');
    const txt  = $('#vitrinaWhatsappText');
    const note = $('#vitrinaNote');
    if (!btn || !txt) return;

    const now  = new Date();
    const day  = now.getDay();
    const h    = now.getHours() + now.getMinutes() / 60;
    const cerrado = day === 0 || (day === 6 && h >= 16);

    if (cerrado) {
      btn.classList.add('disabled');
      btn.setAttribute('aria-disabled', 'true');
      btn.removeAttribute('href');
      txt.textContent = 'Vitrina cerrada \u2014 Volvemos el lunes a las 10:00 AM';
      if (note) note.textContent = '\u00a1Te esperamos el lunes desde temprano!';
    } else {
      btn.classList.remove('disabled');
      btn.removeAttribute('aria-disabled');
      const msg = '\u00a1Hola Sweet Bakery! Vi la secci\u00f3n de Vitrina en la web. \u00bfQu\u00e9 postres o sabores tienen disponibles hoy para pasar a recoger?';
      btn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
      txt.textContent = 'Pregunta por la vitrina de hoy';
      if (note) note.textContent = 'Horario: Lun\u2013Vie 10\u201319h \u00b7 S\u00e1b 10\u201316h \u00b7 Dom cerrado';
    }
  }

  /* ── 3) BOTONES CLÁSICOS ───────────────────────────────── */
  function bindClasicoButtons() {
    $$('[data-product]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = btn.dataset.product;
        const msg = '\u00a1Hola Sweet Bakery! Vi su cat\u00e1logo en la web y me interesa ' + product + '. \u00bfCu\u00e1l es la disponibilidad y c\u00f3mo puedo apartar?';
        window.open(
          'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg),
          '_blank', 'noopener'
        );
      });
    });
  }

  /* ── 4) NAVBAR ─────────────────────────────────────────── */
  function bindNavbar() {
    const nav    = $('#navbar');
    const toggle = $('#navToggle');
    const links  = $('.nav-links');
    if (!nav || !toggle || !links) return;

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      links.classList.toggle('open');
    });

    $$('.nav-links a').forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── 5) REVEAL ON SCROLL ───────────────────────────────── */
  function bindRevealObserver() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in-view'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach(el => obs.observe(el));

    setTimeout(() => {
      items.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('in-view');
          obs.unobserve(el);
        }
      });
    }, 100);
  }

  /* ── 6) COTIZADOR WIZARD ───────────────────────────────── */
  const BETUN_OPTIONS = {
    small: [
      { label: 'Chantilly', price: 0 },
      { label: 'Buttercream', price: 0 },
      { label: 'Crema Philadelphia', price: 0 },
      { label: 'Bet\u00fan americano', price: 0 },
      { label: 'Fondant', price: 100 }
    ],
    large: [
      { label: 'Chantilly', price: 0 },
      { label: 'Buttercream', price: 0 },
      { label: 'Crema Philadelphia', price: 0 },
      { label: 'Bet\u00fan americano', price: 0 },
      { label: 'Fondant (cobro extra)', price: 150 },
      { label: 'Semi naked / naked', price: 0 },
      { label: 'Texturado', price: 0 },
      { label: 'Efecto espejo', price: 200 }
    ]
  };

  let currentStep = 1;
  const TOTAL_STEPS = 5;

  const state = { size: null, tier: null, basePrice: 0 };

  function calcTotal() {
    let total = state.basePrice;

    // Rellenos crujientes
    $$('[name="crujiente"]:checked').forEach(el => {
      total += Number(el.dataset.price || 0);
    });
    // Relleno especial
    $$('[name="especial"]:checked').forEach(el => {
      total += Number(el.dataset.price || 0);
    });
    // Bet\u00fan (radio)
    const betunChecked = $('[name="betun"]:checked');
    if (betunChecked) total += Number(betunChecked.dataset.price || 0);
    // Topper (radio \u00fanico entre MDF/Acr\u00edlico/Cartoncillo)
    const topperChecked = $('[name="topper"]:checked');
    if (topperChecked) total += Number(topperChecked.dataset.price || 0);
    // Extras
    $$('[name="extra"]:checked').forEach(el => {
      const qty = el.dataset.quantity
        ? Number(el.closest('.chip').querySelector('.qty-input')?.value || 1)
        : 1;
      total += Number(el.dataset.price || 0) * qty;
    });
    // Flor
    const florChecked = $('[name="flor"]:checked');
    if (florChecked) total += Number(florChecked.dataset.price || 0);
    // Vela (radio \u00fanica)
    const velaChecked = $('[name="vela"]:checked');
    if (velaChecked) total += Number(velaChecked.dataset.price || 0);

    // Macarons stepper
    const macaronQtyEl = document.getElementById('macaronQty');
    const macaronQty = macaronQtyEl ? parseInt(macaronQtyEl.value) || 0 : 0;
    total += macaronQty * 20;
    return total;
  }

  function renderTotal() {
    const el = $('#totalAmount');
    if (el) el.textContent = formatMoney(calcTotal());
  }

  function renderBetunOptions(tier) {
    const grid = $('#betunGrid');
    const hint = $('#betunHint');
    if (!grid) return;
    const opts = BETUN_OPTIONS[tier] || BETUN_OPTIONS.small;
    if (hint) hint.textContent = tier === 'large'
      ? 'Para pasteles medianos o grandes puedes elegir varios acabados.'
      : 'Elige el estilo de bet\u00fan.';
    grid.innerHTML = opts.map((o, i) =>
      '<label class="chip">' +
        '<input type="radio" name="betun" value="' + o.label + '" data-price="' + o.price + '"' + (i === 0 ? ' checked' : '') + '/>' +
        '<span>' + o.label + (o.price > 0 ? ' <small>(+$' + o.price + ')</small>' : '') + '</span>' +
      '</label>'
    ).join('');
    grid.querySelectorAll('input').forEach(inp =>
      inp.addEventListener('change', renderTotal)
    );
  }

  function setStep(n) {
    $$('.step').forEach(s => s.classList.remove('active'));
    const target = $('.step[data-step="' + n + '"]');
    if (target) target.classList.add('active');

    $$('.step-pill').forEach(p => {
      const num = Number(p.dataset.pill);
      p.classList.toggle('active', num === n);
      p.classList.toggle('done',   num < n);
    });

    const fill   = $('#progressFill');
    if (fill) fill.style.width = ((n - 1) / (TOTAL_STEPS - 1) * 100) + '%';

    const prev   = $('#btnPrev');
    const next   = $('#btnNext');
    const submit = $('#btnSubmit');
    if (prev)   prev.disabled = n === 1;
    if (next)   next.classList.toggle('hidden', n === TOTAL_STEPS);
    if (submit) submit.classList.toggle('hidden', n !== TOTAL_STEPS);

    if (n === 5) buildPickupOptions();

    currentStep = n;
    renderTotal();
  }

  function buildPickupOptions() {
    const dateInput  = $('#pickupDate');
    const timeSelect = $('#pickupTime');
    if (!dateInput || !timeSelect) return;

    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() + MIN_DAYS_AHEAD);
    dateInput.min = toLocalISO(minDate);
    if (!dateInput.value) dateInput.value = toLocalISO(minDate);

    function buildTimes() {
      const d    = dateInput.value ? new Date(dateInput.value + 'T12:00:00') : minDate;
      const sched = SCHEDULE[d.getDay()];
      timeSelect.innerHTML = '<option value="">Selecciona una hora</option>';
      if (!sched) {
        timeSelect.innerHTML += '<option disabled>Cerrado ese d\u00eda</option>';
        return;
      }
      for (let h = sched.open; h < sched.close; h++) {
        timeSelect.innerHTML += '<option value="' + pad(h) + ':00">' + pad(h) + ':00</option>';
        if (h + 0.5 < sched.close)
          timeSelect.innerHTML += '<option value="' + pad(h) + ':30">' + pad(h) + ':30</option>';
      }
    }

    buildTimes();
    dateInput.removeEventListener('change', buildTimes);
    dateInput.addEventListener('change', buildTimes);
  }

  function buildWhatsappMessage() {
    const size   = $('[name="size"]:checked');
    const pan    = $('#panSelect');
    const crem   = $('[name="cremoso"]:checked');
    const cruj   = $$('[name="crujiente"]:checked').map(e => e.value);
    const esp    = $$('[name="especial"]:checked').map(e => e.value);
    const betun  = $('[name="betun"]:checked');
    const topper = $('[name="topper"]:checked');
    const extras = $$('[name="extra"]:checked').map(e => {
      const qty = e.dataset.quantity
        ? Number(e.closest('.chip').querySelector('.qty-input')?.value || 1)
        : 1;
      return qty > 1 ? e.value + ' x' + qty : e.value;
    });
    const flor   = $('[name="flor"]:checked');
    const vela   = $('[name="vela"]:checked');
    const date   = $('#pickupDate')?.value || '(sin fecha)';
    const time   = $('#pickupTime')?.value || '(sin hora)';
    const name   = $('#customerName')?.value || 'Cliente';
    const total  = calcTotal();

    let msg = '\ud83c\udf82 *Cotizaci\u00f3n Sweet Bakery*\n\n';
    msg += '\ud83d\udc64 Nombre: ' + name + '\n';
    msg += '\ud83d\udccf Tama\u00f1o: ' + (size ? size.value : '\u2014') + ' ($' + (size ? size.dataset.price : 0) + ')\n';
    msg += '\ud83c\udf5e Pan: ' + (pan ? pan.value : '\u2014') + '\n';
    msg += '\ud83c\udf53 Relleno cremoso: ' + (crem ? crem.value : '\u2014') + '\n';
    if (cruj.length)  msg += '\u2728 Crujiente: ' + cruj.join(', ') + '\n';
    if (esp.length)   msg += '\u2b50 Especial: ' + esp.join(', ') + '\n';
    msg += '\ud83c\udfa8 Bet\u00fan: ' + (betun ? betun.value : '\u2014') + '\n';
    if (topper && topper.value !== 'Sin topper') msg += '\ud83c\udf80 Topper: ' + topper.value + '\n';
    if (extras.length) msg += '\u2728 Extras: ' + extras.join(', ') + '\n';
    if (flor && flor.value !== 'Sin flor') msg += '\ud83d\udc90 Flor: ' + flor.value + '\n';
    if (vela && vela.value !== 'Sin vela') msg += '\ud83d\udd6f Vela: ' + vela.value + '\n';
    msg += '\n\ud83d\udcc5 Fecha de recolecci\u00f3n: ' + date + ' a las ' + time + '\n';
    msg += '\n\ud83d\udcb0 *Total estimado: ' + formatMoney(total) + '*\n\n';
    msg += '_(Los precios son estimados. El total final se confirma al apartar con anticipo.)_';
    // Macarons stepper
    const _mQty = parseInt(document.getElementById('macaronQty')?.value) || 0;
    if (_mQty > 0) msg += '\n🎀 Macarons: ' + _mQty + ' pza ($' + (_mQty * 20) + ')';
    // Topper detail (nombre o número)
    const _topperDetail = (document.getElementById('topperDetailInput')?.value || '').trim();
    if (_topperDetail) msg += ' (“' + _topperDetail + '”)';
    return msg;
  }

  function bindWizard() {
    const wizard = $('.wizard');
    if (!wizard) return;

    // Tama\u00f1o
    $$('[name="size"]').forEach(radio => {
      radio.addEventListener('change', () => {
        state.basePrice = Number(radio.dataset.price || 0);
        state.tier      = radio.dataset.tier || 'small';
        state.size      = radio.value;
        renderBetunOptions(state.tier);
        renderTotal();
      });
    });

    // Todos los inputs de precio
    wizard.addEventListener('change', (e) => {
      const el = e.target;
      if (['crujiente','especial','extra','flor','betun','topper','vela'].includes(el.name)) {
        renderTotal();
      }
      // Macarons cantidad (m\u00e1x 6)
      if (el.name === 'extra' && el.dataset.quantity) {
        const qtyInput = el.closest('.chip').querySelector('.qty-input');
        if (qtyInput) {
          qtyInput.disabled = !el.checked;
          if (el.checked) qtyInput.max = 6;
        }
      }
    });

    wizard.addEventListener('input', (e) => {
      if (e.target.classList.contains('qty-input')) renderTotal();
    });

    // Navegaci\u00f3n
    $('#btnNext')?.addEventListener('click', () => {
      if (currentStep < TOTAL_STEPS) {
        if (!validateStep(currentStep)) return;
        markStepCompleted(currentStep);
        setStep(currentStep + 1);
      }
    });
    $('#btnPrev')?.addEventListener('click', () => {
      if (currentStep > 1) setStep(currentStep - 1);
    });

    // Enviar por WhatsApp
    $('#btnSubmit')?.addEventListener('click', () => {
      const name = $('#customerName')?.value.trim();
      const date = $('#pickupDate')?.value;
      const time = $('#pickupTime')?.value;
      if (!name) { showToast('Por favor ingresa tu nombre.'); return; }
      if (!date) { showToast('Por favor elige una fecha de recolección.'); return; }
      if (!time) { showToast('Por favor elige una hora de recolección.'); return; }
      showQuoteModal();
    });
    // Inicializar
    renderBetunOptions('small');
    setStep(1);
  }

  /* ── 7) A\u00d1O EN FOOTER ──────────────────────────────────── */
  function setYear() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── 8) SMOOTH SCROLL ───────────────────────────────────── */
  function bindSmoothScroll() {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ── 9) ACTIVE NAV LINK ─────────────────────────────────── */
  function bindActiveNavLink() {
    const sections = $$('section[id], footer[id]');
    const navLinks = $$('.nav-links a');
    if (!sections.length || !navLinks.length) return;

    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(a => {
              a.classList.toggle('active',
                a.getAttribute('href') === '#' + entry.target.id);
            });
          }
        });
      },
      { threshold: 0.35 }
    );
    sections.forEach(s => obs.observe(s));
  }

  /* ── INIT ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    updateStatusBadge();
    updateVitrinaButton();
    bindClasicoButtons();
    bindNavbar();
    bindRevealObserver();
    bindWizard();
    setYear();
    bindSmoothScroll();
    bindActiveNavLink();

    setInterval(() => {
      updateStatusBadge();
      updateVitrinaButton();
    }, 60000);
  
  // Stepper de Macarons: llamado desde onclick en index.html
  window.changeMacarons = function changeMacarons(delta) {
    const countEl  = document.getElementById('macaronCount');
    const qtyInput = document.getElementById('macaronQty');
    const minusBtn = document.getElementById('macaronMinus');
    const plusBtn  = document.getElementById('macaronPlus');
    const priceTag = document.getElementById('macaronPriceTag');
    if (!countEl || !qtyInput) return;
    let current = parseInt(countEl.textContent) || 0;
    current = Math.min(6, Math.max(0, current + delta));
    countEl.textContent = current;
    qtyInput.value = current;
    // Botones
    minusBtn.disabled = current === 0;
    plusBtn.disabled  = current === 6;
    // Precio inline
    if (priceTag) {
      if (current > 0) {
        priceTag.textContent = '$' + (current * 20);
        priceTag.style.display = '';
      } else {
        priceTag.style.display = 'none';
      }
    }
    // Recalcular
    calcTotal();
    renderTotal();
  };

  // ---- Campo dinámico del Topper ----
  function updateTopperDetail() {
    const selected = document.querySelector('[name="topper"]:checked');
    const detail   = document.getElementById('topperDetail');
    const label    = document.getElementById('topperDetailLabel');
    const input    = document.getElementById('topperDetailInput');
    const hint     = document.getElementById('topperDetailHint');
    if (!detail || !selected) return;

    const val = selected.value;
    const needsName   = val.indexOf('Nombre') > -1;
    const needsNumber = val.indexOf('N\u00famero') > -1 || val.indexOf('Numero') > -1;

    if (!needsName && !needsNumber) {
      detail.style.display = 'none';
      if (input) input.value = '';
      return;
    }

    detail.style.display = 'block';

    if (needsName) {
      if (label) label.textContent = '\u00bfQu\u00e9 nombre llevar\u00e1 el topper?';
      if (input) { input.type = 'text'; input.maxLength = 30; input.placeholder = 'Ej. Mar\u00eda, Carlos, Sof\u00eda\u2026'; }
      if (hint)  hint.textContent = 'M\u00e1x. 30 caracteres \u00b7 Solo el primer nombre o apodo';
    } else {
      if (label) label.textContent = '\u00bfQu\u00e9 n\u00famero llevar\u00e1 el topper?';
      if (input) { input.type = 'number'; input.min = '0'; input.max = '999'; input.placeholder = 'Ej. 15, 18, 50\u2026'; }
      if (hint)  hint.textContent = 'N\u00famero de a\u00f1os, fecha o cualquier cifra';
    }
  }

  // Bind topper detail listener
  document.querySelectorAll('[name="topper"]').forEach(function(radio) {
    radio.addEventListener('change', updateTopperDetail);
  });
  // Run once on load
  updateTopperDetail();
});



  /* ===== TOAST NOTIFICATION ===== */
  function showToast(msg, type) {
    var toast = document.getElementById('validationToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'validation-toast visible' + (type === 'success' ? ' toast-success' : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() { toast.className = 'validation-toast'; }, 3200);
  }

  /* ===== STEP VALIDATION ===== */
  function validateStep(step) {
    if (step === 1) {
      var sized = document.querySelector('input[name="size"]:checked');
      if (!sized) { showToast('Por favor elige un tamaño para tu pastel.'); return false; }
    }
    if (step === 2) {
      var pan = document.getElementById('panSelect');
      if (!pan || !pan.value) { showToast('Por favor selecciona el tipo de pan.'); return false; }
      var relleno = document.querySelector('input[name="filling"]:checked');
      if (!relleno) { showToast('Por favor elige un relleno cremoso.'); return false; }
    }
    if (step === 3) {
      var betun = document.querySelector('input[name="betun"]:checked');
      if (!betun) { showToast('Por favor elige un estilo de betún.'); return false; }
    }
    return true;
  }

  /* ===== PROGRESS STEP MARKS ===== */
  var _completedSteps = new Set();
  function markStepCompleted(step) {
    _completedSteps.add(step);
    var pills = document.querySelectorAll('.progress-pill');
    if (pills[step - 1]) pills[step - 1].setAttribute('data-done', 'true');
  }

  /* ===== QUOTE SUMMARY MODAL ===== */
  function showQuoteModal() {
    var modal = document.getElementById('quoteModal');
    var body = document.getElementById('quoteModalBody');
    var totalEl = document.getElementById('quoteModalTotal');
    if (!modal || !body) return;

    // Build summary rows
    var size = document.querySelector('input[name="size"]:checked');
    var pan = document.getElementById('panSelect');
    var filling = document.querySelector('input[name="filling"]:checked');
    var betun = document.querySelector('input[name="betun"]:checked');
    var date = document.getElementById('pickupDate')?.value || '';
    var time = document.getElementById('pickupTime')?.value || '';
    var name = document.getElementById('customerName')?.value.trim() || '';
    var total = calcTotal();

    var rows = [];
    if (size) rows.push(['Tamaño', size.closest('label')?.querySelector('h3,h4,strong')?.textContent?.trim() || size.value]);
    if (pan) rows.push(['Pan', pan.options[pan.selectedIndex]?.text || '']);
    if (filling) rows.push(['Relleno', filling.value]);
    if (betun) rows.push(['Betún', betun.value]);
    if (date) rows.push(['Fecha', date]);
    if (time) rows.push(['Hora', time]);
    if (name) rows.push(['Nombre', name]);

    body.innerHTML = rows.map(function(r) {
      return '<div class="quote-row"><span class="quote-row-label">' + r[0] + '</span><span class="quote-row-value">' + r[1] + '</span></div>';
    }).join('');

    if (totalEl) totalEl.textContent = '$' + total.toLocaleString();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Bind confirm button
    var confirmBtn = document.getElementById('quoteModalConfirm');
    var cancelBtn = document.getElementById('quoteModalCancel');
    var closeBtn = document.getElementById('quoteModalClose');

    function closeModal() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (confirmBtn) confirmBtn.onclick = function() {
      closeModal();
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildWhatsappMessage());
      window.open(url, '_blank');
    };

    modal.onclick = function(e) { if (e.target === modal) closeModal(); };
  }

})();
