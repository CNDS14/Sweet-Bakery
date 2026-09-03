# Sweet Bakery · Sitio web

Sitio de una sola página para **Sweet Bakery**, repostería artesanal en Chihuahua, Chih.
Publicado con GitHub Pages en **https://cnds14.github.io/Sweet-Bakery/**

- Instagram: [@sweetbakery.cuu](https://www.instagram.com/sweetbakery.cuu/)
- WhatsApp: 614 286 8000 (solo WhatsApp, no llamadas)
- Local: Calle 24 #2104, Chihuahua, Chih., C.P. 31205
- Horario: Lun–Vie 10:00–19:00 · Sáb 10:00–16:00 · Dom cerrado

## Qué hay en el sitio

| Sección | Qué hace |
|---|---|
| Vitrina del Día | Postres listos para llevar, con botón directo a WhatsApp |
| **Cotizador** | Asistente de 5 pasos que calcula el precio en vivo y arma el pedido en WhatsApp |
| Clásicos de Línea | Mostachones, cheesecake vasco y las 8 galletas gourmet |
| Tus Momentos | Estilos que trabajamos + enlace a Instagram |
| Sabor del Mes | Relleno especial de edición limitada (el mes se actualiza solo) |
| Galería | Ejemplos filtrables por categoría |
| Nosotros / Política / FAQ | Historia, condiciones de apartado y preguntas frecuentes |

## Archivos

```
index.html      Todo el contenido y la estructura
style.css       Estilos (paleta, layout, responsive)
script.js       Cotizador, horarios, galería y mensajes de WhatsApp
img/            Logo, foto de galletas e imagen para compartir
favicon.svg     Icono de la pestaña
sitemap.xml     Para buscadores
robots.txt      Para buscadores
```

## Cómo cambiar los precios y el contenido

Casi todo lo que cambia con el tiempo está junto, arriba de `script.js`:

```js
var WHATSAPP_NUMBER = '5216142868000'; // número de WhatsApp Business
var MIN_DAYS_AHEAD  = 4;               // anticipación mínima en días
var SCHEDULE = { ... };                // horario por día (null = cerrado)
var SABOR_MES = { nombre: null, ... }; // sabor del mes
var BETUN_OPTIONS = { ... };           // precios de betún por tamaño
var TIRITAS_OBLEA = { ... };           // precio de oblea por tamaño
```

**Sabor del Mes:** escribe el nombre en `SABOR_MES.nombre` (y opcionalmente
`descripcion`). Si lo dejas en `null`, el sitio muestra "Pregunta por el sabor
de este mes" — nunca queda un sabor viejo publicado. El mes y el año del listón
se calculan automáticamente.

**Precios de tamaños, extras y toppers:** están en los `data-price` de
`index.html`, dentro de la sección del cotizador. El total se recalcula solo.

**Fotos:** pon los archivos en `img/` y reemplaza los `cloudinary-placeholder`
de la galería, la historia y el Sabor del Mes por etiquetas `<img>`.

## Cómo publicar un cambio

```bash
git add -A
git commit -m "descripción del cambio"
git push
```

GitHub Pages reconstruye el sitio en un par de minutos. Si un cambio de CSS o JS
no se ve, súbele el número de versión al final del enlace en `index.html`
(`style.css?v=12` → `?v=13`) para saltar el caché del navegador.

## Notas técnicas

- Sin dependencias ni build: HTML, CSS y JavaScript planos.
- El cotizador no cobra ni guarda datos: arma un mensaje de WhatsApp con el
  resumen del pedido y el total estimado.
- Las fechas de recolección respetan la anticipación mínima y saltan los
  domingos automáticamente.
- Se respeta `prefers-reduced-motion` para quien tenga animaciones reducidas.
