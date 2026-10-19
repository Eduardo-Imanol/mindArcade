# FOCUS

## Active objective (single)
spec-03 "memorama" — APPROVED 2026-10-19. Execute SDD gates then tasks T1–T10.

## Current phase
Fase 1 ✅ + Fase 2 ✅ (gates verificados 2026-10-19):
- F1: AGENTS.md 51 líneas, sin secrets/.env, permisos claros (autónomos: lint/test; aprobación humana: deps nuevas, infra, git history-rewrite). Sin MCP/servidores necesarios.
- F2: spec-03 firmada = template completo (HU, AC-1..AC-12 binarios, restricciones, casos límite, contrato de pruebas, firma Eduardo). Interfaces verificadas contra código real (srs shape, registry, GameHost GRADE_DIFFICULTY, CardImage, store quota-safe) — cero patrones inventados.
Siguiente: Fase 3 ✅ (tasks.md T1–T10 firmado) → Fase 4: arrancar T1 ∥ T2 ∥ T7.

## Blockers
- none

## Decisions locked (spec-03)
- Grades por intentos: 1.er intento `facil`, 2–3 `dificil`, nunca hallado `otra-vez`.
- Dificultad Fácil 4 / Medio 6 / Difícil 8 parejas; selección SOLO de cartas no aprendidas (aleatoria, `selectDueCards`, "aprendida" ≡ `reps >= 3`).
- Contrato de juego extendido solo aditivamente: `selectCards?` opcional; SRS vive en GameHost.
- 1 jugador. Flip 3D CSS puro. TTS al voltear + 🔊 + toggle global (T7/T8, al final del plan).
- Sin dependencias nuevas.

## Next atomic step
T1–T10 ✅ (2026-10-19: 155 tests green, lint 0, build OK). Verificador adversario: 5 hallazgos corregidos. Pendiente: aprobación humana del diff (T10) → siguiente spec (ahorcado, spec-04).
