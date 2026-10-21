# FOCUS

## Active objective (single)
spec-15 "pwa-arcade-cover" — **T1–T13 implementados y documentados 2026-10-21**;
gates verdes (tests 100%, lint 0, build OK). Pendiente T14 (verificación manual:
instalar la PWA en Chrome) y T15 (firma humana de la spec). Petición explícita de
Eduardo: PWA instalable (hoy Chrome decía «Esta aplicación no puede ser
instalarse») + carátula arcade propia.

**Pendientes de firma (anteriores):** spec-12, spec-13 y spec-14 siguen
esperando aprobación humana del diff; spec-13 conserva T23 (sesión manual
360px + teclado) sin cerrar.

## Current phase
Fases SDD para spec-15:
- F1 ✅ Guardarraíles vigentes (AGENTS.md; sin secrets; deps/infra/git-history
  requieren aprobación humana).
- F2 ✅ `specs/spec-15-pwa-arcade-cover.md` (draft) con alcance PWA + marca.
- F3 ✅ `tasks.md` con T1–T15 y grafo de dependencias.
- F4 ✅ Fases A–C (T1–T11) implementadas: arte propio (PNG sin deps), manifest,
  SW, `_headers`, `index.html`, registro del SW, carátula en el hub.
- F5 ✅ Fase D: gates (`npm test`, `npm run lint` 0, `npm run build` OK — solo
  warning preexistente de chunk >500 kB) + docs sincronizados (spec, tasks,
  MEMORY, FOCUS, checklist a11y).
- F6 🟡 Cierre: T14 verificación manual (instalar PWA) + T15 firma.

## Blockers
- T14: verificación manual humana de la instalación (Chrome Android y escritorio).
- Firmas pendientes: spec-12, spec-13, spec-14 y spec-15.

## Done this session (2026-10-21)
- **spec-15 Fase A**: `scripts/p5-art/raster.mjs` (canvas RGBA + encoder PNG con
  `node:zlib`), `scripts/p5-art/pixel-font.mjs` (fuente pixel 5×7),
  `scripts/p5-art/arcade-brand.mjs` (icono de gabinete + cover 1200×630),
  `scripts/generate-pwa-assets.mjs` (`npm run pwa:assets`).
- **spec-15 Fase B**: `public/manifest.webmanifest` (standalone, iconos any +
  maskable, shortcuts), `public/sw.js` (install/activate/fetch, precache del
  shell, cache-first en `/assets/`, network-first en navegaciones),
  `src/core/pwa/registerServiceWorker.js` + registro en `src/main.jsx` solo en
  PROD, `public/_headers` con `Content-Type: application/manifest+json`.
- **spec-15 Fase C**: carátula arcade en el hero del hub (`TopicsHub.jsx` +
  `.hub-cover` en `tokens.css`).
- **spec-15 Fase D**: `scripts/generate-pwa-assets.test.mjs` (10 casos) y
  `src/core/pwa/registerServiceWorker.test.js` (4 casos); `tasks.md` de spec-13
  archivado en `specs/tasks-13-impeccable-ui-retouch.md`.
- **spec-11 (cerrado)**: D-pad táctil de la serpiente movido justo debajo del
  tablero (`3adc282`, subido a `origin/main`).

## Decisions (spec-15)
- **Cero dependencias**: nada de `vite-plugin-pwa`/Workbox; el SW es propio y
  los PNG se generan con Node puro (`node:zlib`).
- **Rutas relativas** (`./`) en manifest/HTML/SW para tolerar subpaths.
- **Netlify y MIME**: Netlify no sirve `.webmanifest` como
  `application/manifest+json`; se fuerza con `public/_headers` (sin tocar
  `netlify.toml`, para no pisar la config del panel).
- **La carátula no implica contenido nuevo**: comunica la visión (programación,
  idiomas, universidad); los temas curriculares siguen fuera de alcance.
- **El hub gana la carátula como portada**: la idea «arcade de aprendizaje» se
  entiende al entrar, no solo al instalar.

## Previous increments
- spec-14 "topic-content-pipeline" — implementación T1–T8 completa 2026-10-21;
  gates verdes 680/680; pendiente firma humana del diff (AC-29 al primer tema real).
- spec-13 "impeccable-ui-retouch" — T1–T22 + T24 implementados; plan archivado en
  `specs/tasks-13-impeccable-ui-retouch.md`; pendiente T23 y firma.
- spec-12 "retouch-learning-dashboard" — implementación T1–T11 completa
  2026-10-20; gates verdes 654/654; pendiente firma humana del diff/spec.
- spec-11 "serpiente-significados" — cerrada técnicamente 2026-10-20;
  catálogo **8 juegos / 8 available / 0 soon**.

## Next atomic step
T14 (humano): desplegar en Netlify, abrir la app en Chrome (Android y
escritorio) y comprobar que aparece «Instalar» con el icono propio, que la app
arranca sin conexión y que la carátula se ve bien en el hub (360px y desktop).
Después: T15 (firma de spec-15) y firma de los incrementos pendientes.

