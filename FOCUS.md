# FOCUS

## Active objective (single)
spec-08 "intruso" (El intruso) — **COMPLETED 2026-10-19**.
Implementación T1–T10, docs, verificación adversarial AC-1..AC-14 y archivo de tasks completados.

## Current phase
Fases SDD para spec-08:
- F1 ✅ Guardarraíles vigentes (AGENTS.md; sin secrets; deps/infra/git-history requieren aprobación humana).
- F2 ✅ `specs/spec-08-intruso.md` firmada por Eduardo con decisiones: 3 significados del ancla + 1 intruso de otro tema; gate 2 temas × ≥3 cartas; un intento con grade en el tema de la intrusa; rondas 3–10 default 10; TTS obligatorio.
- F3 ✅ `tasks.md` spec-08 aprobado (T1–T10). spec-06 archivada en `specs/tasks-06-quiz-significado.md` (T8 `[~]` — pendiente diff humano).
- F4 ✅ T1 lógica pura, T2 tests, T3 availability helper, T4 UI/CSS, T5 GameHost (gate + groups + topic-aware grade), T6 registry (5 available / 5 soon), T7 TopicView, T8 UI/a11y/isolation, T9 integración GameHost, docs AC-13. Gates `test` 296/296, `lint` 0, `build` OK (warning preexistente de chunk).
- F5 ✅ Verificación adversarial AC-1..AC-14 **PASS** (0 bloqueantes); `tasks.md` archivado en `specs/tasks-08-intruso.md`. Checklist manual a11y en navegador pendiente de ejecución humana (no bloqueante).

## Blockers
- none

## Decisions locked (spec-08)
- Gate de contenido en helper puro `src/games/availability.js`: ancla ≥3 cartas y ≥2 temas con ≥3 cartas; mensaje «En mantenimiento · agrega otro tema con al menos 3 cartas».
- `GameHost` arma `groups` (ancla siempre incluida + temas elegibles) con overrides de imagen; `onGrade(cardId, grade, { topicId })` valida el tema contra el catálogo.
- La intrusa se califica en SU tema; XP/racha se mantienen en GameHost.
- `intruso` no usa `selectCards`; la ronda se arma con el ancla completa y anti-repetición de intrusas.
- TTS: prompt con título del ancla, `back` al elegir, 🔊 del intruso revelado; `stopSpeech()` al desmontar.
- `spec-05` (sopa de letras) sigue pendiente; `caza-significados` (spec-07) conserva su idea original.

## Next atomic step
Decidir el siguiente incremento: spec-05 (sopa de letras) o spec-07 (caza-significados). Pendiente heredado: aprobación humana del diff de spec-06 (T8 `[~]`).
