# FOCUS

## Active objective (single)
spec-23 "integracion-hardening" — **T1–T5 ejecutados hasta donde es automatable**
(2026-11-03): auditoría de specs 17–22, cierre de `spec-16`, matriz de 8 rutas y
storage, matriz de 11 juegos/arcade/TTS, bundle lazy, 360/1440 sin overflow, docs
finales y gates en verde. Único pendiente: la pasada manual VoiceOver/teclado
físico (spec-23 T4 + specs 13/18/19/22) y la firma humana de los diffs.

**Pendientes de firma (anteriores):** spec-12, spec-13, spec-14, spec-15,
spec-17, spec-18, spec-19, spec-20 y spec-22 siguen esperando aprobación humana
del diff; spec-13 conserva T23 (sesión manual 360px + teclado), spec-15 T14
(instalar la PWA en Chrome), spec-18 T15 (manual 360/VoiceOver), spec-19 la
revisión manual del lector y spec-22 la lectura con VoiceOver.

## Current phase
Fases SDD para spec-23:
- F1 ✅ Guardarraíles vigentes (AGENTS.md; sin secrets; deps/infra/git-history
  requieren aprobación humana).
- F2 ✅ `specs/spec-23-integracion-hardening.md` firmada.
- F3 ✅ `specs/tasks-23-integracion-hardening.md` (T1–T5).
- F4 ✅ T1: auditoría de 17–22, grafo real y cierre de `spec-16`.
- F5 ✅ T2: 8 rutas + deep link/recarga/atrás y storage compat/cuota/custom.
- F6 ✅ T3: matriz de 11 juegos, mazos, arcade, récords y TTS (36 files/243 tests).
- F7 ⏳ T4: bundle lazy, 360/1440, pausa hidden y checklist/contrato a11y de
  `SettingsView` verificados; falta la pasada manual VoiceOver/teclado.
- F8 ✅ T5: docs finales (architecture/testing/security/manual-a11y + MEMORY/FOCUS),
  ACs/tasks actualizados y gates `npm test` 1067/1067, `npm run lint` 0,
  `npm run build` OK. El cierre formal espera la pasada manual y la firma humana.

## Blockers
- Aprobación humana del diff de spec-22 y de incrementos anteriores.
- VoiceOver de spec-22 y manuales a11y pendientes (spec-13/15/18/19 y spec-23 T4).

## Done this session (2026-11-03)
- **spec-23 T5 — docs y gates**: `docs/architecture.md` (SettingsView, alias
  `#/personalizados` y estado del programa), `docs/testing.md` (sección de
  integración spec-23), `docs/security.md` (keys de ejercicios y auditoría de
  storage) y `docs/manual-a11y-checklist.md` (estado y pasada manual pendiente).
  `MEMORY.md`/`FOCUS.md` sincronizados; ACs/tasks de spec-23 actualizados.
- **Gates finales**: `npm test` **1067/1067** (123 files), `npm run lint` **0**,
  `npm run build` **OK** (solo warning preexistente de chunk >500 kB). Sin
  dependencias nuevas, sin red para progreso/XP/historial y sin secretos.
- **Cierre**: el programa 17→19→18→20∥22→21 queda integrado; la declaración
  formal de «terminado» espera la pasada manual VoiceOver/360 px y la firma
  humana de los diffs, fuera del alcance automatizable.

## Done this session (2026-10-31)
- **spec-23 T1 — auditoría**: specs 17–22 firmadas; fases reales 17 → 19 → 18 →
  20 ∥ 22 → 21; grafo de dependencias y deudas de cierre documentadas en
  `docs/evidence/spec-23-integracion-hardening.md`.
- **spec-16 cerrada**: nombre correcto, absorbida por `spec-18`, sin tasks
  propias ni ACs huérfanos.
- **spec-23 T2 — rutas/storage**: 8 rutas con deep link, recarga y hashchange;
  `#/configuracion` mínima con `SoundToggle` y resumen de solo lectura;
  `#/personalizados` como alias. Tests de compatibilidad, actualización, cuota,
  corrupto y custom sin source.
- **spec-23 T3 — juegos**: 11 juegos verificados (8 cartas + 3 código), mazos,
  dominio, arcade/récords, TTS/mute, ejercicios universales 2/4/6 y bloqueo por
  categoría; 36 files / 243 tests focalizados verdes.
- **spec-23 T4 — hardening**: build confirma sources/ejercicios en chunks lazy;
  10 rutas medidas a 360/1440 sin overflow; engine/pausa hidden/TTS sin huérfanos;
  checklist manual ampliado y `SettingsView.a11y.test.jsx` con el contrato de la
  vista nueva. VoiceOver queda pendiente de humano.
- **Gates:** `npm test` 1067/1067 (123 files), `npm run lint` 0, `npm run build`
  OK. Sin dependencias nuevas.

## Done this session (2026-10-27)
- **spec-21 T1 — contrato de ejercicios**: `parse.js`, `schema.js`, `select.js`
  y `content/exercises/index.js` con fixtures 10×6, errores acumulados,
  `cardIds` por mazo, piezas reconstruibles y path traversal cerrado.
- **spec-21 T2 — progreso**: `mastery.js` (estados, `recordExerciseAttempt`,
  pendientes primero) y `storage/exercises.js` (sanitización, JSON corrupto,
  cuota llena sin romper, aislamiento de `sepect.srs.v1`).
- **spec-21 T3 — sandbox**: `buildSandboxHtml`/`runCode`, iframe
  `sandbox="allow-scripts"` sin same-origin, CSP `default-src 'none'`,
  timeout 2 s, comparación profunda y errores de sintaxis.
- **spec-21 T4 — editor**: `CodeEditor` controlado con gutter de líneas, Tab a
  2 espacios, `Ctrl/Cmd+Enter` y estilos 360 px sin scroll horizontal.
- **spec-21 T5 — shell común**: `CodeGameShell` + `useCodeSession` con
  `GameSetup`/`DeckPicker`/modos/dificultad 2/4/6, TTS y mute, progreso X/6,
  «Nivel de ejercicios completado», grading único por carta/sesión, reintento
  Normal y arcade 3 vidas con `onArcadeEnd`.
- **spec-21 T6 — Ordena el código**: banco/zonas con añadir/quitar/subir/bajar,
  comprobación por IDs de `pieces`, solución visible al fallar, IDs duplicados
  rechazados y líneas duplicadas con IDs únicos permitidas.
- **Gates finales:** `npm test` 1002/1002 (111 files), `npm run lint` 0,
  `npm run build` OK (solo warning preexistente de chunk >500 kB).

## Decisions (spec-21)
- Formato Markdown con `Tema:`, `## Mazo`, `### E:` y campos `Cartas`, `Prompt`,
  `Lenguaje`, `Solución`, `Starter`, `Plantilla`, `Blanks`, `Función`, `Casos` y
  `Piezas` opcional; los campos aceptan valor inline o bloque indentado.
- `Blanks` usa `id = respuesta | alternativa`; `Casos` usa
  `[args] → esperado`; `Piezas` admite lista `id = código` o fence de código.
- Selección por dificultad: `facil` 2, `medio` 4, `dificil` 6; primero los no
  aprendidos y luego los pendientes en orden de autoría.
- El progreso es independiente del SRS y vive solo en `sepect.exercises.v1`.
- El sandbox no tiene same-origin: el código del usuario no puede tocar storage
  ni la app; la comunicación es solo por `postMessage`.
- El shell de código comparte selección 2/4/6, progreso y arcade; cada juego
  solo aporta su mecánica. `onExerciseResult` persiste cada intento y `onGrade`
  se emite como máximo una vez por `cardId` y sesión.
- `OrdenaCodigo` compara el orden de los IDs de `pieces`; los IDs duplicados
  invalidan el ejercicio, pero dos líneas con el mismo código y IDs distintos
  son válidas.

## Previous increments
- spec-22 "ahorcado-inversion" — T1–T4 implementados; pendiente VoiceOver/firma.
- spec-20 "juegos-por-categoria" — T1–T4 implementados; pendiente firma.
- spec-18 "mazos-dominio-arcade" — T1–T16 implementados; pendiente manual y firma.
- spec-19 "lector-fuente-tts" — T1–T8 implementados; pendiente revisión/firma.
- spec-17 "biblioteca-categorias-modulos" — T1–T9 + ajuste UX; pendiente firma.
- spec-15 "pwa-arcade-cover" — implementada; pendiente T14 + firma.
- spec-14 "topic-content-pipeline" — implementación completa; pendiente firma.
- spec-13 "impeccable-ui-retouch" — T1–T22 + T24; pendiente T23 y firma.
- spec-12 "retouch-learning-dashboard" — T1–T11; pendiente firma.
- spec-11 "serpiente-significados" — cerrada técnicamente; 8 juegos available.

## Next atomic step
Pasada manual humana de T4 (teclado + VoiceOver/lector real en 360 px sobre las
secciones «Configuración» e «Integración spec-23» de
`docs/manual-a11y-checklist.md`) y aprobación humana de los diffs de specs 12–22.
Con eso se marca AC-1/AC-6 y se declara formalmente cerrado el programa.
