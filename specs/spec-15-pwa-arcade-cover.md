---
feature: pwa-arcade-cover
status: draft
owner: Eduardo
created: 2026-10-21
updated: 2026-10-21
related_tasks: tasks.md (spec-15)
---

# Spec — PWA instalable + carátula arcade (spec-15)

> [!abstract] Resumen
> Corregir la instalabilidad de Sepect en Chrome (hoy muestra «Esta aplicación
> no puede ser instalada» y el icono «N» de Netlify) con manifiesto, iconos PNG
> propios y un service worker propio (cero dependencias). Además, generar una
> carátula arcade 1200×630 —«Arcade de aprendizaje»: programación, idiomas,
> universidad y más temas— usada como portada dentro de la app y como
> `og:image`.

| Campo | Valor |
|---|---|
| Estado | 🟡 Draft — pendiente de firma humana (implementación lista, gates verdes) |
| Escala | Media (PWA + assets de marca; sin tocar lógica de juegos) |
| Fecha | 2026-10-21 |
| Revisada por | Eduardo — petición explícita en chat (PWA instalable + carátula) |

---

## 🎯 Decisiones

1. **Cero dependencias nuevas**: no se añade `vite-plugin-pwa`; el service
   worker es propio (`public/sw.js`) y los PNG se generan con Node puro
   (`node:zlib`), sin p5 ni canvas.
2. **Rutas relativas** (`./`) en manifiesto, `index.html` y SW, para tolerar
   deploys en subpath.
3. **SW propio en `public/`** (no plugin): precache del shell, cache-first para
   `/assets/` con hash, network-first para navegaciones con fallback al shell.
4. **Contenido del cover**:Representation de un arcade con tres máquinas
   (programación, idiomas, universidad) + Copy «ARCADE DE APRENDER» y
   «PROGRAMACION . IDIOMAS . UNIVERSIDAD . MAS TEMAS». La carátula comunica la
   visión; **no** implica añadir contenido curricular nuevo (fuera de alcance).
5. **Netlify**: `public/_headers` fija `Content-Type: application/manifest+json`
   para el manifiesto (Netlify no lo sirve por defecto) y cachés coherentes.
6. **La carátula se ve dentro de la app** (hero del hub) para que el «arcade de
   aprendizaje» se entienda al entrar, no solo en la instalación.

---

## 📐 Alcance

### Dentro
- `public/manifest.webmanifest` con `name`, `short_name`, `id`, `start_url`,
  `scope`, `display: standalone`, `theme_color`, iconos 192/512 + maskable y
  `apple-touch-icon`.
- Iconos PNG generados: `icon-192`, `icon-512`, `icon-maskable-512`,
  `apple-touch-icon` (180), `favicon-32`.
- Carátula `public/cover/arcade-cover.png` (1200×630).
- `public/sw.js` (install/activate/fetch, `skipWaiting`, `clients.claim`).
- `index.html`: manifest, theme-color, iconos, apple-touch, tags OG/Twitter.
- `src/core/pwa/registerServiceWorker.js` + registro en `src/main.jsx`
  (solo `import.meta.env.PROD`).
- Hero de carátula en `src/views/TopicsHub.jsx` + clase `.hub-cover`.
- `public/_headers` (MIME del manifiesto y cachés).
- Tests y scripts de generación (`npm run pwa:assets`).

### Fuera
- Contenido curricular nuevo (temas de inglés/universidad).
- `vite-plugin-pwa`, Workbox, precache autogenerado del bundle.
- Redirecciones SPA (la app usa routing por hash).

---

## ✅ Criterios de aceptación

- **AC-1** `public/manifest.webmanifest` es JSON válido con `name`,
  `short_name`, `start_url`, `scope`, `display: standalone`, `theme_color`,
  `background_color` e iconos PNG de 192 y 512 px.
- **AC-2** Los iconos referenciados existen en `public/icons/` y son PNG con las
  dimensiones declaradas (verificado leyendo la cabecera IHDR).
- **AC-3** `public/sw.js` registra `install`, `activate` y `fetch`, precachea
  `./index.html` y `./manifest.webmanifest`, y usa `skipWaiting`/`clients.claim`.
- **AC-4** `index.html` enlaza el manifiesto, `theme-color`, `apple-touch-icon`,
  iconos y `og:image` de la carátula.
- **AC-5** El registro del SW ocurre solo en producción y no rompe la app si el
  navegador no lo soporta (`registerServiceWorker` devuelve
  `{ok:false, reason:'unsupported'}`).
- **AC-6** El generador es determinista: dos ejecuciones producen los mismos
  bytes; los PNG versionados coinciden con el generador.
- **AC-7** El texto de la carátula no se sale del lienzo (1200×630).
- **AC-8** La carátula aparece en el hub con `alt` descriptivo y sin romper la
  navegación por teclado ni la semántica (`h1` único).
- **AC-9** `npm test`, `npm run lint` y `npm run build` en verde; `dist/`
  contiene `manifest.webmanifest`, `sw.js`, `icons/` y `cover/`.
- **AC-10** `public/_headers` fija `Content-Type: application/manifest+json`
  para `/manifest.webmanifest` en Netlify.

---

## 🧪 Plan de pruebas

- `scripts/generate-pwa-assets.test.mjs`: firma PNG + dimensiones IHDR,
  determinismo, sincronía de assets versionados, manifiesto (campos e iconos),
  `sw.js` (listeners + precache), `index.html` (enlaces) y `main.jsx`
  (registro en PROD), y no-desbordamiento del texto del cover.
- `src/core/pwa/registerServiceWorker.test.js`: normalización de la URL del SW,
  registro con scope, navegador sin soporte y error de registro.

---

## 📦 Entregables

`public/manifest.webmanifest`, `public/sw.js`, `public/_headers`,
`public/icons/*.png`, `public/cover/arcade-cover.png`, `index.html`,
`src/main.jsx`, `src/core/pwa/registerServiceWorker.js`,
`src/views/TopicsHub.jsx`, `src/ui/tokens.css`,
`scripts/p5-art/raster.mjs`, `scripts/p5-art/pixel-font.mjs`,
`scripts/p5-art/arcade-brand.mjs`, `scripts/generate-pwa-assets.mjs`,
`scripts/generate-pwa-assets.test.mjs`.
