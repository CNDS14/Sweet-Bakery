/* ==========================================================
   SWEET BAKERY · script.js  (v2 — corregido y mejorado)
   ========================================================== */

(function () {
     'use strict';

   /* ── CONFIGURACIÓN ─────────────────────────────────────── */
   const WHATSAPP_NUMBER = '5216141234567'; // ← reemplaza con el número real
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
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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
            ? '● Abierto ahora — Pasa por tu antojo'
                   : '○ Cerrado por hoy — Consulta el catálogo';
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

   /* ── 3) BOTONES CLÁSICOS ───────────────────────────────── */
   function bindClasicoButtons() {
          $$('[data-product]').forEach((btn) => {
                   btn.addEventListener('click', () => {
                              const product = btn.dataset.product;
                              const msg = `¡Hola Sweet Bakery! Vi su catálogo en la web y me interesa ${product}. ¿Cuál es la disponibilidad y cómo puedo apartar?`;
                              window.open(
                                           `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
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

   /* ── 5) REVEAL ON SCROLL (CORREGIDO) ──────────────────── */
   function bindRevealObserver() {
          const items = $$('.reveal');
          if (!items.length) return;

       // Agrega la clase de inmediato a los que ya están en el viewport
       const triggerAll = () => items.forEach(el => el.classList.add('in-view'));

       if (!('IntersectionObserver' in window)) {
                triggerAll();
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

       // Forzar check inicial para elementos ya visibles al cargar
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
             { label: 'Betún americano', price: 0 },
             { label: 'Fondant', price: 100 }
                 ],
          large: [
             { label: 'Chantilly', price: 0 },
             { label: 'Buttercream', price: 0 },
             { label: 'Crema Philadelphia', price: 0 },
             { label: 'Betún americano', price: 0 },
             { label: 'Fondant (cobro extra)', price: 150 },
             { label: 'Semi naked / naked', price: 0 },
             { label: 'Texturado', price: 0 },
             { label: 'Efecto espejo', price: 200 }
                 ]
   };

   let currentStep = 1;
     const TOTAL_STEPS = 5;

   // Estado del wizard
   const state = {
          size: null, tier: null, basePrice: 0, extras: []
   };

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
          // Betún (radio → precio)
       const betunChecked = $('[name="betun"]:checked');
          if (betunChecked) total += Number(betunChecked.dataset.price || 0);
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
                   : 'Elige el estilo de betún.';
          grid.innerHTML = opts.map((o, i) => `
                <label class="chip">
                        <input type="radio" name="betun" value="${o.label}" data-price="${o.price}" ${i === 0 ? 'checked' : ''}/>
                                <span>${o.label}${o.price > 0 ? ` <small>(+$${o.price})</small>` : ''}</span>
                                      </label>`).join('');
          grid.querySelectorAll('input').forEach(inp =>
                   inp.addEventListener('change', renderTotal)
                                                     );
   }

   function setStep(n) {
          $$('.step').forEach(s => s.classList.remove('active'));
          const target = $(`.step[data-step="${n}"]`);
          if (target) target.classList.add('active');

       $$('.step-pill').forEach(p => {
                const num = Number(p.dataset.pill);
                p.classList.toggle('active', num === n);
                p.classList.toggle('done',   num < n);
       });

       const fill   = $('#progressFill');
          if (fill) fill.style.width = `${((n - 1) / (TOTAL_STEPS - 1)) * 100}%`;

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
          const dateInput = $('#pickupDate');
          const timeSelect = $('#pickupTime');
          if (!dateInput || !timeSelect) return;

       const now = new Date();
          const minDate = new Date(now);
          minDate.setDate(minDate.getDate() + MIN_DAYS_AHEAD);
          dateInput.min = toLocalISO(minDate);
          if (!dateInput.value) dateInput.value = toLocalISO(minDate);

       // Generar horas según día
       function buildTimes() {
                const d    = dateInput.value ? new Date(dateInput.value + 'T12:00:00') : minDate;
                const day  = d.getDay();
                const sched = SCHEDULE[day];
                timeSelect.innerHTML = '<option value="">Selecciona una hora</option>';
                if (!sched) {
                           timeSelect.innerHTML += '<option disabled>Cerrado ese día</option>';
                           return;
                }
                for (let h = sched.open; h < sched.close; h++) {
                           timeSelect.innerHTML += `<option value="${pad(h)}:00">${pad(h)}:00</option>`;
                           if (h + 0.5 < sched.close)
                                        timeSelect.innerHTML += `<option value="${pad(h)}:30">${pad(h)}:30</option>`;
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
          const extras = $$('[name="extra"]:checked').map(e => {
                   const qty = e.dataset.quantity
                     ? Number(e.closest('.chip').querySelector('.qty-input')?.value || 1)
                              : 1;
                   return qty > 1 ? `${e.value} x${qty}` : e.value;
          });
          const flor   = $('[name="flor"]:checked');
          const date   = $('#pickupDate')?.value || '(sin fecha)';
          const time   = $('#pickupTime')?.value || '(sin hora)';
          const name   = $('#customerName')?.value || 'Cliente';
          const notes  = $('#customerNotes')?.value;
          const total  = calcTotal();

       let msg = `🎂 *Cotización Sweet Bakery*\n\n`;
          msg += `👤 Nombre: ${name}\n`;
          msg += `📏 Tamaño: ${size ? size.value : '—'} ($${size ? size.dataset.price : 0})\n`;
          msg += `🍞 Pan: ${pan ? pan.value : '—'}\n`;
          msg += `🍓 Relleno cremoso: ${crem ? crem.value : '—'}\n`;
          if (cruj.length)  msg += `✨ Crujiente: ${cruj.join(', ')}\n`;
          if (esp.length)   msg += `⭐ Especial: ${esp.join(', ')}\n`;
          msg += `🎨 Betún: ${betun ? betun.value : '—'}\n`;
          if (extras.length) msg += `🎀 Extras: ${extras.join(', ')}\n`;
          if (flor && flor.value !== 'Sin flor') msg += `💐 Flor: ${flor.value}\n`;
          msg += `\n📅 Fecha de recolección: ${date} a las ${time}\n`;
          if (notes) msg += `📝 Notas: ${notes}\n`;
          msg += `\n💰 *Total estimado: ${formatMoney(total)}*\n\n`;
          msg += `_(Los precios son estimados. El total final se confirma al apartar con anticipo.)_`;
          return msg;
   }

   function bindWizard() {
          const wizard = $('.wizard');
          if (!wizard) return;

       // Tamaño
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
                if (['crujiente','especial','extra','flor','betun'].includes(el.name)) {
                           renderTotal();
                }
                // Macarons cantidad
                                     if (el.name === 'extra' && el.dataset.quantity) {
                                                const qtyInput = el.closest('.chip').querySelector('.qty-input');
                                                if (qtyInput) qtyInput.disabled = !el.checked;
                                     }
       });

       wizard.addEventListener('input', (e) => {
                if (e.target.classList.contains('qty-input')) renderTotal();
       });

       // Navegación
       $('#btnNext')?.addEventListener('click', () => {
                if (currentStep < TOTAL_STEPS) setStep(currentStep + 1);
       });
          $('#btnPrev')?.addEventListener('click', () => {
                   if (currentStep > 1) setStep(currentStep - 1);
          });

       // Enviar por WhatsApp
       $('#btnSubmit')?.addEventListener('click', () => {
                const name = $('#customerName')?.value.trim();
                const date = $('#pickupDate')?.value;
                const time = $('#pickupTime')?.value;
                if (!name) { alert('Por favor ingresa tu nombre.'); return; }
                if (!date) { alert('Por favor elige una fecha de recolección.'); return; }
                if (!time) { alert('Por favor elige una hora de recolección.'); return; }
                const msg = buildWhatsappMessage();
                window.open(
                           `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
                           '_blank', 'noopener'
                         );
       });

       // Inicializar
       renderBetunOptions('small');
          setStep(1);
   }

   /* ── 7) AÑO EN FOOTER ──────────────────────────────────── */
   function setYear() {
          const el = $('#year');
          if (el) el.textContent = new Date().getFullYear();
   }

   /* ── 8) SMOOTH SCROLL PARA ANCLAS ──────────────────────── */
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

   /* ── 9) ACTIVE NAV LINK ON SCROLL ──────────────────────── */
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

                                 // Actualizar estado del local cada minuto
                                 setInterval(() => {
                                          updateStatusBadge();
                                          updateVitrinaButton();
                                 }, 60_000);
   });

})();
