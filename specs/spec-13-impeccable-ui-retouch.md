---
feature: impeccable-ui-retouch
status: signed
owner: Eduardo
created: 2026-10-21
updated: 2026-10-21
related_tasks: tasks.md (spec-13)
---

# Spec — Retoque de interfaz bajo gate impeccable (spec-13)

> [!abstract] Resumen
> Revisión de calidad de la interfaz con la skill `impeccable`. Cierra las 3
> incidencias altas (Modal de «Crear tema» inaccesible y renderizado fuera de
> pantalla) y ~22 incidencias medias de design system, tokens, colores,
> duplicación y accesibilidad. Sin backend, sin dependencias nuevas, sin
> reescribir juegos ni partir `tokens.css`.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada — Eduardo aceptó el plan por chat (2026-10-21) |
| Escala | Media (UI + a11y + deduplicación; sin tocar lógica de juegos) |
| Fecha | 2026-10-21 |
| Revisada por | Eduardo — aceptación del plan 2026-10-21; diff pendiente de revisión final |

---

## 🎯 Decisiones aceptadas

1. **Alcance**: altas + medias UI. **Fuera de alcance**: partir `tokens.css`,
   reducir componentes monolíticos de juegos (>200 líneas), eliminar Tailwind,
   refactor de store/persistencia, reescritura de la mecánica de juegos.
2. **Preflight de Tailwind se conserva**; solo se reparan los daños colaterales
   (márgenes UA anulados en pantallas de error, h2 de form, hijos de `Card`).
3. **Modal**: nuevo contrato con prop `title`, overlay fixed + backdrop, focus
   trap, Escape, restauración de foco. Se aplica solo en `TopicsHub` (único
   consumidor actual).
4. **Contraste violeta**: la entrada violeta de `PAIR_COLORS` pasa de `#7c4dff`
   a `#b388ff` (`--neon-violet`) — colorea badge, borde y número de línea SVG;
   contraste ≈6.5:1 sobre `--bg` (antes ≈3.8:1 como texto).

---

## 📖 Historias de usuario

### HU-1 — Crear tema accesible y visible
**Como** aprendiz, **quiero** que el diálogo «Crear tema» se muestre centrado y
sea navegable por teclado, **para** poder crear un tema sin perderme.

**Criterios de aceptación:**
- [x] AC-1: El diálogo se renderiza en overlay `position: fixed` centrado sobre
  backdrop; visible sin scroll al pulsar «Crear tema» con 0 y con N temas.
- [x] AC-2: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` apuntando
  al `h2` «Crear tema» renderizado por el Modal (sin `h2` duplicado en el form).
- [x] AC-3: Al abrir, el foco entra al diálogo; Tab/Shift+Tab quedan atrapados
  dentro; Escape cierra; al cerrar el foco vuelve al botón que lo abrió.
- [x] AC-4: Clic en el backdrop cierra el diálogo. El scroll del body queda
  bloqueado mientras está abierto.
- [x] AC-5: `TopicsHub.a11y.test.jsx` asertúa sobre el DOM renderizado (dialog
  con nombre accesible, foco, Escape), no solo regex sobre CSS.

### HU-2 — Design system coherente
**Como** usuario, **quiero** tokens y componentes consistentes, **para** ver una
interfaz con hover, colores y targets uniformes.

**Criterios de aceptación:**
- [x] AC-6: Cero hex hardcodeados fuera de `:root` en estilos de vistas/UI:
  `#0f051d`, `#0d0d1a`, `#00f5d4` y los hex sueltos de `tokens.css` (395, 961,
  1352, 1368, 1373, 453) sustituidos por custom properties; existe un único
  cian (`--neon-cyan: #00ffcc`) en toda la app.
- [x] AC-7: `.btn-neon` tiene `display: inline-flex`, `cursor: pointer`,
  estados `:hover`/`:active` y bloque `prefers-reduced-motion`; el
  `<a class="btn-neon">` de `Dashboard` cumple min-height 44 px.
- [x] AC-8: El botón ✕ de limpiar búsqueda no tapa el texto del input
  (padding-right ≥ 44 px en `#hub-search`).
- [x] AC-9: El `select` de setup de Serpiente queda estilizado como el del quiz
  (border, background, radio, min-height 44 px) — no transparente por preflight.
- [x] AC-10: Textos con violeta usan `--neon-violet` (`#b388ff`): badge y
  números de línea de Conecta Pares con contraste ≥ 4.5:1 sobre `--bg`.

### HU-3 — Sin duplicación ni ruido visual
**Como** mantenedor, **quiero** componentes compartidos, **para** evitar
divergencias entre vistas.

**Criterios de aceptación:**
- [x] AC-11: `ProgressBar` existe una única vez en `src/components/` y lo usan
  `TopicsHub`, `TopicView` y `Dashboard` (sin copias locales).
- [x] AC-12: El bloque `studyCardCounts` está extraído a un hook compartido
  usado por `TopicView` y `GameHost`.
- [x] AC-13: La constante `PAGE` desaparece de `GameHost`, `TopicsHub`,
  `ConectaPares` y `NotFound`; usan la clase existente `.topic-page`.
- [x] AC-14: Los estilos inline `INPUT`/`CONTROL` de `TopicsHub` pasan a clases
  en `tokens.css`.
- [x] AC-15: `html`/`body` tienen `background: var(--bg)` — sin destello
  blanco en overscroll iOS.
- [x] AC-16: Las pantallas de error/404 (`GameHost`, `NotFound`) tienen ritmo
  vertical explícito (h1→p→a) independiente de los márgenes UA.
- [x] AC-17: El `h1` de juegos usa la clase compartida `.game-app-title`
  (sustituye `style={{ fontSize: 24 }}`), sin regresiones visuales.
- [x] AC-18: `src/components/Button.jsx` (código muerto, cero importaciones)
  eliminado.

### HU-4 — Accesibilidad media y estado compartido
**Como** usuario de teclado/lector de pantalla, **quiero** feedback correcto,
**para** navegar sin sorpresas.

**Criterios de aceptación:**
- [x] AC-19: `document.title` se actualiza por ruta (Temas / Progreso / tema /
  juego / 404).
- [x] AC-20: Los tiles de juego no disponibles son anunciados por lector de
  pantalla (`aria-describedby` → mensaje de disponibilidad con `id`).
- [x] AC-21: `SoundToggle` sin doble señalización (`aria-pressed` + label
  dinámico): conserva `aria-pressed` con `aria-label` estático; el estado se
  sincroniza entre instancias y pestañas (emisor en `settings.js` +
  evento `storage`).
- [x] AC-22: `Dashboard` empareja temas con métricas por `id`, no por índice
  de array.
- [x] AC-23: `html[lang="es"]`, foco visible global y targets ≥ 44 px se
  conservan (sin regresiones del patrón actual).

---

## 🚧 Restricciones arquitectónicas

- Sin dependencias nuevas; sin backend; sin llamadas de red.
- No se parte `tokens.css` ni se reescriben componentes de juegos (solo
  reemplazos mecánicos `style` → `className` puntuales, T10).
- Un solo game loop intacto; audio con toggle; `prefers-reduced-motion`
  respetado en cualquier transición nueva.
- Local-first: localStorage/IndexedDB como hasta ahora.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Abrir «Crear tema» con muchos temas | Diálogo visible centrado, sin scroll |
| Escape con foco en textarea | Cierra sin perder datos (form no controlado remoto) |
| Múltiples `SoundToggle` montados | Cambio en uno sincroniza a todos |
| Pestaña secundaria cambia mute | `storage` event sincroniza la otra pestaña |
| `metrics[id]` ausente en Dashboard | Se muestra sin métricas, sin crash |
| Sin preferencia de motion | Transiciones de `.btn-neon` visibles |

---

## 🧪 Contrato de pruebas

```
ENTRADA: mount(<TopicsHub />) → click «Crear tema»
SALIDA: dialog con aria-labelledby="…" visible en DOM, foco dentro,
        Escape lo elimina y devuelve foco al botón.

ENTRADA: ruta #/ , #/progreso , #/tema/x , #/tema/x/juego/y , #/nope
SALIDA: document.title cambia a "Sepect — Temas" | "Sepect — Progreso" |
        "Sepect — {título}" | "Sepect — {juego}" | "Sepect — 404"

ENTRADA: SoundToggle ×2 montados → click en el primero
SALIDA: ambos reflejan muted=true (estado sincronizado)

GATES: npm test (100%) · npm run lint (0 warnings) · npm run build (OK)
```

---

## ✍️ Firma

- [x] Spec revisada y firmada por humano (aceptación del plan, 2026-10-21)
- [ ] Diff final revisado por humano (al cerrar T1–T4)
