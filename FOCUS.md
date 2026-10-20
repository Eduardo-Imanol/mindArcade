# FOCUS

## Active objective (single)
spec-06 "quiz-significado" (Elige el significado) — **APPROVED 2026-10-19**.
Spec firmada + tasks T1–T8 aprobadas. Implementación pendiente (T1–T8).

## Current phase
Fases SDD para spec-06:
- F1 ✅ Guardarraíles vigentes (AGENTS.md; sin secrets; permisos: lint/test autónomos, deps/infra/git-history requieren aprobación humana).
- F2 ✅ `specs/spec-06-quiz-significado.md` firmada por Eduardo con decisiones: pregunta arriba solo `front` (sin imagen) + TTS; 4 opciones 2×2 con `CardImage` + `back`; 1 correcta + 3 distractores del deck completo con dedupe; 2 intentos → facil/dificil/otra-vez; rondas 3–10 default 10 vía `selectCards`; TTS automático + 🔊 + toggle global.
- F3 ✅ `tasks.md` spec-06 aprobado (T1–T8). spec-04 archivada en `specs/tasks-04-ahorcado.md` (T10 queda `[~]` pendiente de diff humano).
- F4 ⏳ En ejecución: T1 ✅ lógica pura + T2 ✅ tests, T3 ✅ UI/CSS (20 tests del juego). Siguiente: T4 registry.

## Blockers
- none

## Decisions locked (spec-06)
- Pregunta superior = solo `front`; opciones = `CardImage` decorativa (`alt=""`) + `back`.
- Distractores desde el deck completo (no solo las rondas seleccionadas), dedupe por `back` normalizado, excluyendo la carta correcta por `id`; fallback 2–4 opciones.
- Grades: 1.er intento correcto `facil`; 2.º intento correcto `dificil`; 2 fallos `otra-vez` revelando la correcta.
- Rondas 3–10 (default 10); `selectCards(rounds)` con no-aprendidas primero y backfill por `nextReview`.
- Salida a mitad: `pendingGrades` → `otra-vez` solo para rondas sin resolver (seq monótono).
- SRS/XP/history solo en GameHost; sin cambios en `GameHost.jsx` ni en el núcleo.
- Spec-05 (sopa de letras) queda pendiente; se adelantó spec-06 por petición de Eduardo.

## Next atomic step
Ejecutar T4: `quiz-significado` → `available` en `src/games/registry.js` + actualizar `registry.test.js`.
