# tasks.md — spec-15 pwa-arcade-cover

> Spec `specs/spec-15-pwa-arcade-cover.md` (🟡 draft, pendiente de firma).
> Incremento pedido por Eduardo en chat: PWA instalable en Chrome + carátula
> arcade propia («Arcade de aprendizaje»: programación, idiomas, universidad).
> Sin dependencias nuevas (SW propio en `public/`, PNG generados con Node puro).
>
> Incremento anterior: spec-13 «impeccable-ui-retouch» archivado en
> `specs/tasks-13-impeccable-ui-retouch.md` (pendiente T23 manual + firma).

## Objetivo del incremento

Que Chrome ofrezca «Instalar» en Sepect con icono y nombre propios, que la app
funcione sin conexión y que la portada del hub comunique el concepto de arcade
de aprendizaje con una carátula generada en el repo.

## Tareas

### Fase A — Marca e iconos (arte generado, sin deps)

- [x] T1 — `scripts/p5-art/raster.mjs`: canvas RGBA + encoder PNG con
  `node:zlib`; primitivas (rect, roundRect, circle, polygon, line, glow, grid,
  scanlines), `encodePNG`, `readPNGSize`.
- [x] T2 — `scripts/p5-art/pixel-font.mjs`: fuente pixel 5×7 con `drawText` y
  `textWidth` (necesaria para medir desbordamientos del cover).
- [x] T3 — `scripts/p5-art/arcade-brand.mjs`: `drawIcon` (gabinete arcade con
  serpiente) y `drawCover` (1200×630, tres gabinetes: CÓDIGO/IDIOMA/UNIV),
  `coverLayout` para medir la composición.
- [x] T4 — `scripts/generate-pwa-assets.mjs`: `generatePwaAssets({root,force})`
  → `icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon`,
  `favicon-32` y `cover/arcade-cover.png`; script npm `pwa:assets`.

### Fase B — PWA instalable

- [x] T5 — `public/manifest.webmanifest`: `name`/`short_name`/`id`/`start_url`/
  `scope`, `display: standalone`, `theme_color`, iconos any + maskable,
  shortcuts «Temas» y «Progreso».
- [x] T6 — `public/sw.js`: `install` (precache del shell con
  `Promise.allSettled`), `activate` (limpieza de cachés + `clients.claim`),
  `fetch` (navegaciones network-first con fallback, `/assets/` cache-first,
  resto cache-first con refresco en segundo plano).
- [x] T7 — `index.html`: `<link rel="manifest">`, `theme-color`, iconos
  32/192, `apple-touch-icon`, `mobile-web-app-capable`, tags OG/Twitter con la
  carátula.
- [x] T8 — `src/core/pwa/registerServiceWorker.js` + registro en
  `src/main.jsx` solo en `import.meta.env.PROD`, con `BASE_URL`.
- [x] T9 — `public/_headers`: `Content-Type: application/manifest+json` en
  Netlify (no se sirve por defecto), `Cache-Control` de sw/icons/cover/assets.

### Fase C — Carátula dentro de la app

- [x] T10 — Hero de carátula en `src/views/TopicsHub.jsx` (`<img>` con `alt`
  descriptivo, `width`/`height` para evitar CLS) + clase `.hub-cover` en
  `src/ui/tokens.css` (responsive, borde neon, sin layout shift).

### Fase D — Gates y docs

- [x] T11 — `scripts/generate-pwa-assets.test.mjs` (10 casos) y
  `src/core/pwa/registerServiceWorker.test.js` (4 casos).
- [x] T12 — Gates: `npm test`, `npm run lint`, `npm run build` en verde.
- [x] T13 — Docs: spec-15, este `tasks.md`, `FOCUS.md`, `MEMORY.md`,
  `docs/manual-a11y-checklist.md` (carátula + PWA).
- [ ] T14 — Verificación manual humana: instalar la PWA en Chrome (Android y
  escritorio), comprobar el icono propio en el launcher/escritorio y que el
  modo sin conexión abre la app.
- [ ] T15 — Firma humana de la spec-15.

## Grafo de dependencias

T1 → T2 → T3 → T4 → (T5, T7, T10) → T6 → T8 → T9 → T11 → T12 → T13 → T14 → T15

## Fuera de alcance

- Contenido curricular nuevo (temas de inglés/universidad).
- `vite-plugin-pwa`/Workbox y precache autogenerado del bundle.
- Redirecciones SPA (la app enruta por hash).
