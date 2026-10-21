# FOCUS

## Active objective (single)
spec-13 "impeccable-ui-retouch" — **T1–T22 + T24 implementados y documentados
2026-10-21**; gates verdes (671/671 tests, lint 0, build OK). Pendiente T23
(sesión manual 360px + teclado del flujo «Crear tema») y la firma humana del
diff. La aprobación/firma de spec-12 sigue pendiente; no se abre otro
incremento hasta cerrar ambas.

**Adicional (cerrado técnicamente):** spec-14 «topic-content-pipeline» T1–T8 completados
2026-10-21; gates verdes (680/680 tests, lint 0, build OK), skill + referencias
y test de arte generalizado. Pendiente firma humana del diff. AC-29 al ejecutar
el primer tema real.

## Current phase
Fases SDD para spec-13:
- F1 ✅ Guardarraíles vigentes (AGENTS.md; sin secrets; deps/infra/git-history
  requieren aprobación humana).
- F2 ✅ `specs/spec-13-impeccable-ui-retouch.md` (firmada) con alcance 3 altas
  + medias UI.
- F3 ✅ `tasks.md` con T1–T24 y grafo de dependencias.
- F4 ✅ Fases A–C (T1–T21) implementadas.
- F5 ✅ Fase D: gates (`npm test` 671/671, `npm run lint` 0, `npm run build`
  OK — solo warning preexistente de chunk >500 kB) + docs sincronizados
  (checklist a11y, MEMORY, FOCUS, spec ACs y tareas marcadas).
- F6 🟡 Cierre: T23 sesión manual + firma humana del diff.

## Blockers
- T23: sesión manual humana (360px + teclado, flujo «Crear tema»).
- Firmas pendientes: spec-12 y spec-13 (difiere de aprobación de implementación).

## Done this session (2026-10-21)
- **Fase A (T1–T4)**: `Modal.jsx` con overlay/backdrop, `role="dialog"`,
  `aria-labelledby` (prop `title` + `useId`), focus trap Tab/Shift+Tab, Escape,
  restauración de foco y scroll lock; clases `.modal-*`; `CreateTopicForm` sin
  `h2` propio; tests DOM en `TopicsHub.a11y.test.jsx`.
- **Fase B (T5–T15)**: tokens nuevos (`--bg3`, `--bg-deep`, `--neon-violet`,
  `--cyan-dim`, `--text-dim`, …); cian unificado `#00ffcc` (fuera `#00f5d4` y
  `#0d0d1a`); violeta pares `#b388ff` (6.5:1); `.btn-neon` completo con
  reduced-motion; estilos de `select` de serpiente; `.error-page` y
  `.game-app-title`; `PAGE`/`INPUT`/`CONTROL` fuera de vistas; `Button.jsx`
  eliminado.
- **Fase C (T16–T21)**: `components/ProgressBar.jsx`, hook
  `views/useStudyCardCounts.js`, `document.title` por ruta (test
  `src/app/title.test.js`), `aria-describedby` en tiles de juegos,
  emisor `subscribeSettings` + `SoundToggle` sincronizado con
  `useSyncExternalStore` (test AC-21), `Dashboard` empareja métricas por `id`.
- **Gate de design system**: `src/ui/design-system.test.js` cubre AC-6..AC-18
  y AC-9/10/11/12/13/14/20/22 por regex/DOM.

## Decisions (spec-13)
- **Contraste**: nuevo token `--neon-violet: #b388ff` para texto violeta
  (≈6.5:1); el violeta original `#7c4dff` solo sobrevive si lo exige el diseño.
- **Un solo cian app-wide**: `--neon-cyan: #00ffcc`; el gate de
  `design-system.test.js` falla si reaparece `#00f5d4`/`#0d0d1a`.
- **Tailwind preflight se conserva**: los daños colaterales (márgenes UA
  anulados) se reparan con clases explícitas (`.error-page`,
  `.game-app-title`), quitando Tailwind está fuera de alcance.
- **Tests leen tokens.css/código fuente**: al mover código a componentes hay
  que actualizar las aserciones (pasó con ConectaPares y Dashboard).
- **TopicView conserva `button[disabled]`** + `aria-describedby` (AC-20).
- **Fuera de alcance**: partir `tokens.css`, reducir juegos >200 líneas,
  refactor de store/persistencia, tocar `metrics.js`.

## Previous increments
- spec-14 "topic-content-pipeline" — implementación T1–T8 completa 2026-10-21;
  gates verdes 680/680, generalización verificada con tema sintético; pendiente
  firma humana del diff (AC-29 al primer tema real).
- spec-12 "retouch-learning-dashboard" — implementación T1–T11 completa
  2026-10-20; gates verdes 654/654; pendiente firma humana del diff/spec.
- spec-11 "serpiente-significados" — cerrada técnicamente 2026-10-20;
  catálogo **8 juegos / 8 available / 0 soon**.

## Next atomic step
T23 (humano): `npm run dev`, sesión en 360px + solo teclado del flujo
«Crear tema» contra el checklist `docs/manual-a11y-checklist.md` (sección
spec-13) → firma del diff → archivar `tasks.md` en `specs/tasks-13-*.md` si
procede. Antes de firmar, re-ejecutar `npm test`, `npm run lint` y
`npm run build`.
