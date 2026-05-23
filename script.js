/* ==========================================================
   SWEET BAKERY · script.js
   Lógica de cotizador, estado del local en tiempo real,
   reveal on scroll y generación de mensajes WhatsApp.
   ========================================================== */

(function () {
  'use strict';

  // === CONFIGURACIÓN ===
  // ⚠️ Reemplaza este número por el WhatsApp Business real (formato internacional sin "+")
  const WHATSAPP_NUMBER = '5216141234567';

  const SCHEDULE = {
    // 0=Dom, 1=Lun, ..., 6=Sáb
    0: null,                     // Domingo cerrado
    1: { open: 10, close: 19 },  // Lunes
    2: { open: 10, close: 19 },
    3: { open: 10, close: 19 },
    4: { open: 10, close: 19 },
    5: { open: 10, close: 19 },
    6: { open: 10, close: 16 }   // Sábado
  };

  const MIN_DAYS_AHEAD = 4;

  // === HELPERS ===
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const formatMoney = (n) => '$' + Math.round(n).toLocaleString('es-MX');

  const pad = (n) => String(n).padStart(2, '0');
  const toLocalISO = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  // ====================================================
  // 1) ESTADO DEL LOCAL EN TIEMPO REAL
  // ====================================================
  function isStoreOpenNow() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours() + now.getMinutes() / 60;
    const sched = SCHEDULE[day];
    if (!sched) return false;
    return hours >= sched.open && hours < sched.close;
  }

  function updateStatusBadge() {
    const badge = $('#statusBadge');
    if (!badge) return;
    const text = $('.status-text', badge);
    if (isStoreOpenNow()) {
      badge.classList.add('open');
      badge.classList.remove('closed');
      text.textContent = '● Abierto ahora — Pasa por tu antojo';
    } else {
      badge.classList.add('closed');
      badge.classList.remove('open');
      text.textContent = '○ Cerrado por hoy — Consulta el catálogo';
    }
  }

  // ====================================================
  // 2) BOTÓN DINÁMICO DE WHATSAPP — VITRINA
  // ====================================================
  function updateVitrinaButton() {
    const btn = $('#vitrinaWhatsapp');
    const txt = $('#vitrinaWhatsappText');
    const note = $('#vitrinaNote');
    if (!btn || !txt) return;

    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours() + now.getMinutes() / 60;

    // Sábado después de las 16:00 + todo el domingo => deshabilitado
    const sabadoCerrado = day === 6 && hours >= 16;
    const domingo = day === 0;

    if (sabadoCerrado || domingo) {
      btn.classList.add('disabled');
      btn.setAttribute('aria-disabled', 'true');
      btn.removeAttribute('href');
      txt.textContent = 'Vitrina cerrada — Volvemos el lunes a las 10:00 AM';
      if (note) note.textContent = '¡Te esperamos el lunes desde temprano!';
    } else {
      btn.classList.remove('disabled');
      btn.removeAttribute('aria-disabled');
      const msg = '¡Hola Sweet Bakery! Vi la sección de Vitrina en la web. ¿Qué postres o sabores tienen disponibles hoy para pasar a recoger?';
      btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      txt.textContent = 'Pregunta por la vitrina de hoy';
      if (note) note.textContent = 'Horario: Lun–Vie 10–19h · Sáb 10–16h · Dom cerrado';
    }
  }

  // ====================================================
  // 3) BOTONES "CLÁSICOS" — Preguntar disponibilidad
  // ====================================================
  function bindClasicoButtons() {
    $$('[data-product]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = btn.dataset.product;
        const msg = `¡Hola Sweet Bakery! Vi su catálogo en la web y me interesa ${product}. ¿Cuál es la disponibilidad y cómo puedo apartar?`;
        window.open(
          `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
          '_blank',
          'noopener'
        );
      });
    });
  }

  // ====================================================
  // 4) NAVBAR — Scroll y toggle móvil
  // ====================================================
  function bindNavbar() {
    const nav = $('#navbar');
    const toggle = $('#navToggle');
    const links = $('.nav-links');

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    });

    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    $$('.nav-links a').forEach((a) =>
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  // ====================================================
  // 5) REVEAL ON SCROLL · Intersection Observer
  // ====================================================
  function bindRevealObserver() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window) || items.length === 0) {
      items.forEach((el) => el.classList.add('in-view'));
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
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    items.forEach((el) => obs.observe(el));
  }

  // ====================================================
  // 6) COTIZADOR — Wizard de 5 pasos
  // ====================================================
  const Cotizador = (() => {
    let currentStep = 1;
    const totalSteps = 5;

    // Opciones de betún según tier
    const BETUN_OPTIONS = {
      small: [
        { name: 'Orillas', price: 20 },
        { name: 'Vintage', price: 50 },
        { name: 'Peludito', price: 60 }
      ],
      large: [
        { name: 'Orillas', price: 30 },
        { name: 'Vintage', price: 80 },
        { name: 'Peludito', price: 100 }
      ],
      fixed: [
        { name: 'Cúpula', price: 60 },
        { name: 'Dibujo sencillo', price: 60 },
        { name: 'Dibujo elaborado', price: 100 },
        { name: 'Dripp', price: 20 }
      ]
    };

    function init() {
      bindStepNavigation();
      bindLiveTotal();
      renderBetunOptions('small');
      bindSizeChange();
      bindQuantityChips();
      initDatepicker();
      initTimepicker();
      $('#btnSubmit').addEventListener('click', submitQuote);
      updateProgress();
    }

    function bindStepNavigation() {
      $('#btnNext').addEventListener('click', nextStep);
      $('#btnPrev').addEventListener('click', prevStep);
    }

    function nextStep() {
      if (!validateStep(currentStep)) return;
      if (currentStep < totalSteps) {
        currentStep++;
        renderStep();
      }
    }

    function prevStep() {
      if (currentStep > 1) {
        currentStep--;
        renderStep();
      }
    }

    function renderStep() {
      $$('.step').forEach((s) =>
        s.classList.toggle('active', Number(s.dataset.step) === currentStep)
      );
      $$('.step-pill').forEach((p) => {
        const n = Number(p.dataset.pill);
        p.classList.toggle('active', n === currentStep);
        p.classList.toggle('done', n < currentStep);
      });
      updateProgress();
      updateControls();
      // scroll suave a la parte alta del wizard
      const wiz = $('.wizard');
      if (wiz) {
        const top = wiz.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }

    function updateProgress() {
      const pct = (currentStep / totalSteps) * 100;
      $('#progressFill').style.width = pct + '%';
    }

    function updateControls() {
      const prev = $('#btnPrev');
      const next = $('#btnNext');
      const submit = $('#btnSubmit');
      prev.disabled = currentStep === 1;
      if (currentStep === totalSteps) {
        next.classList.add('hidden');
        submit.classList.remove('hidden');
      } else {
        next.classList.remove('hidden');
        submit.classList.add('hidden');
      }
    }

    function validateStep(step) {
      if (step === 1) {
        const size = $('input[name="size"]:checked');
        if (!size) {
          alert('Por favor elige un tamaño para continuar.');
          return false;
        }
      }
      if (step === 5) {
        // se valida al enviar
      }
      return true;
    }

    // ---------- BETÚN ----------
    function renderBetunOptions(tier) {
      const grid = $('#betunGrid');
      const variable = BETUN_OPTIONS[tier];
      const fixed = BETUN_OPTIONS.fixed;
      grid.innerHTML = '';

      const buildChip = (opt) => `
        <label class="chip">
          <input type="checkbox" name="betun" value="${opt.name}" data-price="${opt.price}" />
          <span>${opt.name} <small>(+$${opt.price})</small></span>
        </label>`;

      grid.innerHTML =
        variable.map(buildChip).join('') + fixed.map(buildChip).join('');

      $('#betunHint').textContent =
        tier === 'large'
          ? 'Para tamaños Mediano/Grande aplican precios ampliados.'
          : 'Selecciona uno o varios acabados para tu pastel.';

      // bind nuevos chips al total
      $$('input[name="betun"]', grid).forEach((i) =>
        i.addEventListener('change', recalcTotal)
      );
    }

    function bindSizeChange() {
      $$('input[name="size"]').forEach((r) => {
        r.addEventListener('change', (e) => {
          const tier = e.target.dataset.tier;
          renderBetunOptions(tier);
          recalcTotal();
        });
      });
    }

    // ---------- CANTIDAD (Macarons) ----------
    function bindQuantityChips() {
      $$('.quantity-chip').forEach((chip) => {
        const checkbox = $('input[type="checkbox"]', chip);
        const qty = $('.qty-input', chip);
        checkbox.addEventListener('change', () => {
          chip.classList.toggle('active', checkbox.checked);
          qty.disabled = !checkbox.checked;
          if (checkbox.checked && !qty.value) qty.value = 1;
          recalcTotal();
        });
        qty.addEventListener('input', () => {
          // sanitizar
          let v = parseInt(qty.value, 10);
          if (isNaN(v) || v < 1) v = 1;
          if (v > 50) v = 50;
          qty.value = v;
          recalcTotal();
        });
        qty.addEventListener('click', (e) => e.stopPropagation());
      });
    }

    // ---------- TOTAL EN VIVO ----------
    function bindLiveTotal() {
      // Cualquier cambio dentro del wizard recalcula
      $('.wizard').addEventListener('change', recalcTotal);
    }

    function recalcTotal() {
      let total = 0;

      const size = $('input[name="size"]:checked');
      if (size) total += Number(size.dataset.price);

      // crujientes
      $$('input[name="crujiente"]:checked').forEach(
        (i) => (total += Number(i.dataset.price || 0))
      );
      // especial
      $$('input[name="especial"]:checked').forEach(
        (i) => (total += Number(i.dataset.price || 0))
      );
      // betún
      $$('input[name="betun"]:checked').forEach(
        (i) => (total += Number(i.dataset.price || 0))
      );
      // flor
      const flor = $('input[name="flor"]:checked');
      if (flor) total += Number(flor.dataset.price || 0);

      // extras
      $$('input[name="extra"]:checked').forEach((i) => {
        const base = Number(i.dataset.price || 0);
        if (i.dataset.quantity === 'true') {
          const chip = i.closest('.quantity-chip');
          const qty = chip ? Number($('.qty-input', chip).value || 1) : 1;
          total += base * qty;
        } else {
          total += base;
        }
      });

      const el = $('#totalAmount');
      el.textContent = formatMoney(total);
      el.classList.remove('bump');
      // Trigger reflow para reiniciar animación
      void el.offsetWidth;
      el.classList.add('bump');
    }

    // ---------- DATEPICKER ----------
    function initDatepicker() {
      const input = $('#pickupDate');
      const help = $('#dateHelp');

      const today = new Date();
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + MIN_DAYS_AHEAD);
      // Si la fecha mínima cae domingo, mover al lunes
      while (minDate.getDay() === 0) {
        minDate.setDate(minDate.getDate() + 1);
      }
      input.min = toLocalISO(minDate);
      input.value = toLocalISO(minDate);

      input.addEventListener('change', () => {
        const v = input.value;
        if (!v) return;
        const [y, m, d] = v.split('-').map(Number);
        const picked = new Date(y, m - 1, d);

        // Bloquear domingos
        if (picked.getDay() === 0) {
          alert('Los domingos permanecemos cerrados. Por favor elige otro día.');
          input.value = input.min;
          help.textContent = 'Los domingos no hay recolección. Selecciona otro día.';
          help.style.color = 'var(--blush-dark)';
          return;
        }

        // Bloquear fechas antes del mínimo
        if (picked < minDate) {
          alert(`Necesitamos mínimo ${MIN_DAYS_AHEAD} días de anticipación.`);
          input.value = input.min;
          return;
        }

        help.textContent = `Recolección programada el ${formatPickupDate(picked)}.`;
        help.style.color = 'var(--olive)';
        refreshTimeOptions(picked.getDay());
      });

      // Inicial
      refreshTimeOptions(minDate.getDay());
    }

    function formatPickupDate(date) {
      return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    // ---------- TIMEPICKER ----------
    function initTimepicker() {
      // Se inicializa con la fecha mínima ya cargada en initDatepicker
    }

    function refreshTimeOptions(day) {
      const select = $('#pickupTime');
      const sched = SCHEDULE[day];
      select.innerHTML = '<option value="">Selecciona una hora</option>';
      if (!sched) {
        select.innerHTML +=
          '<option value="" disabled>Día cerrado</option>';
        return;
      }
      // intervalos de 30 minutos hasta una hora antes del cierre
      for (let h = sched.open; h < sched.close; h += 0.5) {
        const hh = Math.floor(h);
        const mm = h % 1 === 0 ? '00' : '30';
        const label = `${pad(hh)}:${mm}`;
        const opt = document.createElement('option');
        opt.value = label;
        opt.textContent = label + ' hrs';
        select.appendChild(opt);
      }
    }

    // ---------- ENVÍO DE COTIZACIÓN ----------
    function submitQuote() {
      // Validaciones finales
      const size = $('input[name="size"]:checked');
      if (!size) {
        alert('Falta seleccionar el tamaño.');
        currentStep = 1; renderStep(); return;
      }
      const date = $('#pickupDate').value;
      const time = $('#pickupTime').value;
      if (!date || !time) {
        alert('Por favor selecciona fecha y hora de recolección.');
        currentStep = 5; renderStep(); return;
      }

      const pan = $('#panSelect').value;
      const cremoso = $('input[name="cremoso"]:checked')?.value || '—';
      const crujientes = $$('input[name="crujiente"]:checked').map((i) => i.value);
      const especial = $$('input[name="especial"]:checked').map((i) => i.value);
      const betun = $$('input[name="betun"]:checked').map(
        (i) => `${i.value} (+$${i.dataset.price})`
      );
      const flor = $('input[name="flor"]:checked');
      const florText = flor && flor.value !== 'Sin flor' ? flor.value : null;

      const extras = $$('input[name="extra"]:checked').map((i) => {
        if (i.dataset.quantity === 'true') {
          const chip = i.closest('.quantity-chip');
          const qty = chip ? Number($('.qty-input', chip).value || 1) : 1;
          return `${i.value} x${qty}`;
        }
        return i.value;
      });

      const nombre = $('#customerName').value.trim() || 'Cliente Sweet Bakery';
      const notas = $('#customerNotes').value.trim();
      const total = $('#totalAmount').textContent;

      const [y, m, d] = date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const fechaFormatted = formatPickupDate(dateObj);

      // Construir mensaje estético
      const lines = [];
      lines.push('¡Hola Sweet Bakery! 🎂');
      lines.push('Cotizo un pastel personalizado con estos detalles:');
      lines.push('');
      lines.push(`👤 *Nombre:* ${nombre}`);
      lines.push('');
      lines.push('🎂 *PASTEL*');
      lines.push(`• Tamaño: ${size.value} ($${size.dataset.price})`);
      lines.push(`• Pan: ${pan}`);
      lines.push(`• Relleno cremoso: ${cremoso}`);
      if (crujientes.length) lines.push(`• Relleno crujiente: ${crujientes.join(', ')}`);
      if (especial.length) lines.push(`• Relleno especial: ${especial.join(', ')}`);
      lines.push('');
      if (betun.length) {
        lines.push('🍥 *BETÚN*');
        betun.forEach((b) => lines.push(`• ${b}`));
        lines.push('');
      }
      if (extras.length || florText) {
        lines.push('✨ *EXTRAS & DECORACIÓN*');
        extras.forEach((e) => lines.push(`• ${e}`));
        if (florText) lines.push(`• ${florText}`);
        lines.push('');
      }
      lines.push('📅 *RECOLECCIÓN EN TIENDA*');
      lines.push(`• Fecha: ${fechaFormatted}`);
      lines.push(`• Hora: ${time} hrs`);
      lines.push('• Sucursal: Calle 24 #2104, Chihuahua, Chih.');
      lines.push('');
      lines.push(`💰 *TOTAL ESTIMADO: ${total}*`);
      if (notas) {
        lines.push('');
        lines.push(`📝 *Notas:* ${notas}`);
      }
      lines.push('');
      lines.push('Quedo a la espera de la confirmación y el anticipo para apartar la fecha. ¡Gracias! 💕');

      const message = lines.join('\n');
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener');
    }

    return { init };
  })();

  // ====================================================
  // 7) BOOT
  // ====================================================
  function boot() {
    // Año del footer
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    updateStatusBadge();
    updateVitrinaButton();
    bindClasicoButtons();
    bindNavbar();
    bindRevealObserver();
    Cotizador.init();

    // Recheck cada minuto el estado del local
    setInterval(() => {
      updateStatusBadge();
      updateVitrinaButton();
    }, 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
