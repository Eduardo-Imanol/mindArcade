# tasks.md — spec-13 impeccable-ui-retouch

> Spec `specs/spec-13-impeccable-ui-retouch.md` (✅ aceptada por Eduardo 2026-10-21).
> Plan de 4 fases (A–D) acordado por chat. Alcance: altas + medias UI.
> Fuera de alcance: partir `tokens.css`, refactor de juegos >200 líneas,
> eliminar Tailwind, refactor de store.
>
> Incremento anterior: spec-12 «retouch-learning-dashboard» T1–T11 completados
> (`specs/tasks-12-retouch-learning-dashboard.md`), pendiente aprobación humana
> del diff y firma de la spec. Siguen pendientes las aprobaciones de
> spec-06, spec-09 y spec-10.

## Objetivo del incremento

Gate `impeccable` sobre la interfaz: Modal accesible y visible, design system
con tokens coherentes, componentes compartidos sin duplicación, a11y media
(título SPA, mute sincronizado, tiles no disponibles anunciados).

## Tareas

### Fase A — Modal accesible y funcional (las 3 altas) — AC-1..AC-5

- [x] T1 — `src/components/Modal.jsx`: overlay `position: fixed` + backdrop
  (patrón `.serpiente-pause-overlay`), prop `title` con `h2` interno,
  `aria-labelledby`, foco inicial, focus trap Tab/Shift+Tab, Escape cierra,
  restauración de foco al disparador, bloqueo de scroll del body, clic en
  backdrop cierra.
- [x] T2 — `src/ui/tokens.css`: clases `.modal-overlay` y `.modal`
  (max-width 480px, max-height 90vh, scroll interno, tokens neon).
- [x] T3 — `src/views/TopicsHub.jsx:365`: pasar `title="Crear tema"`; quitar
  el `h2` de `CreateTopicForm` (ya lo renderiza Modal).
- [x] T4 — `src/views/TopicsHub.a11y.test.jsx`: aserciones DOM del diálogo
  (nombre accesible, foco al abrir, trap, Escape, foco restaurado, backdrop).

### Fase B — Tokens, colores y componentes base — AC-6..AC-18

- [x] T5 — `tokens.css` `:root`: añadir `--bg3: #2a1148`, `--bg-deep: #0b0416`,
  `--neon-violet: #b388ff`; reemplazar hex sueltos de tokens.css
  (L84, 190, 292 → `var(--bg)`; L395, 961, 1352, 1368, 1373, 453 → vars).
- [x] T6 — Cian unificado: `InteractiveGameCanvas.js` (L64, 145-148) y
  `.jsx` (L99): `#00f5d4`→`#00ffcc`, `#0d0d1a`→`#0f051d`.
- [x] T7 — `ConectaPares.jsx:34`: violeta texto `#7c4dff`→`#b388ff`
  (badge + números SVG línea). Verificar contraste ≥4.5:1.
- [x] T8 — `.btn-neon` (tokens.css:12): `display:inline-flex`,
  `align-items/justify-content:center`, `gap`, `cursor:pointer`,
  `background:transparent`, `text-decoration:none`, `:hover`/`:active`
  (borde/glow verde), bloque `prefers-reduced-motion`.
  Arregla `Dashboard.jsx:140` (`<a class="btn-neon">` inline sin 44px).
- [x] T9 — `TopicsHub.jsx`: estilos inline `INPUT`/`CONTROL` → clases
  `.hub-field`/`.hub-select` en tokens.css; `padding-right ≥44px` en
  `#hub-search` para no tapar con el ✕ (AC-8).
- [x] T10 — `tokens.css`: `.serpiente-setup-row select` estilado al estilo
  `.quiz-setup select`; `cursor:pointer` en `.serpiente-speak`.
- [x] T11 — Daños del preflight: clase `.error-page` con ritmo h1→p→a para
  `GameHost.jsx:95-135` y `NotFound.jsx`; margen del `h2` del form;
  espaciado de hijos de `Card`.
- [x] T12 — PAGE duplicado ×4: reemplazar `style={PAGE}` por
  `className="topic-page"` (clase ya existente tokens.css:17) en `GameHost`,
  `TopicsHub`, `ConectaPares`, `NotFound`; borrar constantes.
- [x] T13 — Overscroll iOS: `html, body { background: var(--bg) }`.
- [x] T14 — `h1` de juegos: clase `.game-app-title` en tokens.css; reemplazo
  mecánico de `style={{ fontSize: 24 }}` en juegos + `GameHost` (21 sitios).
- [x] T15 — Borrar `src/components/Button.jsx` (código muerto).

### Fase C — Compartidos y a11y media — AC-11..AC-13, AC-19..AC-22

- [x] T16 — Extraer `src/components/ProgressBar.jsx`; consumir en
  `TopicsHub`, `TopicView`, `Dashboard` (borrar copias).
- [x] T17 — Extraer hook `useStudyCardCounts` (compartido `TopicView` +
  `GameHost`).
- [x] T18 — `App.jsx`: `document.title` por ruta (Temas/Progreso/tema/
  juego/404) + test.
- [x] T19 — `TopicView.jsx:126`: `id` en mensaje de disponibilidad +
  `aria-describedby` en el botón `disabled`.
- [x] T20 — `SoundToggle.jsx`: `aria-label` estático con `aria-pressed`;
  emisor `subscribe` en `settings.js` + listener `storage`; consumir con
  `useSyncExternalStore`.
- [x] T21 — `Dashboard.jsx:113`: emparejar tema↔métricas por `id`.

### Fase D — Gate impeccable de cierre

- [x] T22 — `npm test` 100%, `npm run lint` 0 warnings, `npm run build` OK.
- [ ] T23 — Sesión manual: flujo «Crear tema» completo, 360px + teclado,
  reduced-motion. Revisión adversarial del diff (parser/loop/persistencia).
- [x] T24 — Actualizar docs (`docs/manual-a11y-checklist.md`, `MEMORY.md`)
  y dejar tasks.md con gates finales.

## Grafo de dependencias

```
T1–T4 (Fase A)          ← independiente, primera
T5–T7 (tokens/colores)  ← T8–T10 dependen de T5
T11–T15 (base)          ← T8/T9 tocan TopicsHub — secuenciar con T3
T16–T17 (compartidos)   ← independiente de Fase A
T18–T21 (a11y media)    ← T20 independiente; T19 con T11
T22–T24 (gates)         ← al final, secuencial
```

## Decisiones firmadas

- Modal con `title` propio; único consumidor TopicsHub (HU-1).
- Preflight de Tailwind se conserva; solo reparación de daños (AC-16).
- Violeta de Conecta Pares (`PAIR_COLORS`): `#7c4dff` → `#b388ff` (badge, borde
  y número SVG; texto ≥4.5:1).
- Sin dependencias nuevas; sin cambios en SRS/XP/persistencia.

## Gates

- [x] T22: `npm test` 100% · `npm run lint` 0 warnings · `npm run build` OK.
