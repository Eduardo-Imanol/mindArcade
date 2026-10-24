# tasks-22 — ahorcado-inversion

> Derivado de `specs/spec-22-ahorcado-inversion.md` (**firmada 2026-10-23**).
> Lista para implementar.
> Depende de `spec-18` (arcade) solo para no regresionar. Sin dependencias nuevas.

## Objetivo del incremento

Invertir el layout del Ahorcado para que la palabra quede arriba y la pista abajo,
sin tocar lógica, SRS, arcade ni TTS. La inversión es obligatoria; no hay no-op.

## Grafo de dependencias

```
T1 evidencia visual inicial
└── T2 inversión palabra → pista (obligatoria)
    └── T3 tests DOM/a11y
        └── T4 verificación visual + gates + cierre
```

---

## Tareas

### T1 — Evidencia visual y DOM inicial [depends: none]
- [ ] **Deliverable:** nota breve con capturas a 360/768/desktop y medidas
  `getBoundingClientRect()` de palabra/pista antes del cambio.
- [ ] **Verificación:** revisar `Ahorcado.jsx:199-232` y estilos actuales; dejar
  constancia de que la pista está arriba y la palabra abajo.
- **AC cubiertos:** AC-1.
- **Done when:** hay evidencia before antes de tocar código.
- **Estimate:** S.

### T2 — Inversión obligatoria: palabra → pista [depends: T1]
- [ ] **Deliverable:** `src/games/ahorcado/Ahorcado.jsx`:
  - render de palabra antes de pista;
  - `data-testid`/hooks estables (`ahorcado-word`, `ahorcado-hint`);
  - sin cambios de lógica/estado/arte.
- [ ] **Deliverable:** CSS del Ahorcado:
  - separación, wrap de palabra, pista debajo;
  - 360 px sin overflow, targets ≥44 px.
- [ ] **Verificación:** el cambio se aplica siempre; no se acepta no-op.
- **AC cubiertos:** AC-1, AC-2, AC-4, AC-6.
- **Contexto:** spec §Decisión 1–5.
- **Done when:** el orden visual y DOM es palabra → pista.
- **Estimate:** S.

### T3 — Tests DOM y accesibilidad [depends: T2]
- [ ] **Deliverable:** `Ahorcado.test.jsx`:
  - palabra antes que pista en el DOM;
  - `aria-label` de pista;
  - `aria-live` de progreso sin duplicados;
  - teclado;
  - TTS/mute;
  - no regresión de letras/vidas/scoring/arcade.
- **AC cubiertos:** AC-3, AC-4, AC-5.
- **Contexto:** spec HU-1.
- **Done when:** el orden no se puede romper sin test y no existe una salida no-op.
- **Estimate:** S.

### T4 — Verificación visual, docs y gates [depends: T3]
- [ ] **Verificación:** capturas after a 360/768/desktop con `word.top < hint.top`;
  VoiceOver; reduced motion.
- [ ] **Deliverable:** `MEMORY.md`/`FOCUS.md` con el cambio aplicado.
- [ ] **Gates:** `npm test`, `npm run lint`, `npm run build` al 100%.
- [ ] **Cierre:** ACs, tasks y firma.
- **AC cubiertos:** AC-7 y DoD.
- **Done when:** evidencia visual y gates en verde.
- **Estimate:** S.

---

## Fuera de alcance

- Rediseño del juego/muñeco.
- Cambiar palabras/pistas/mazos/vidas/scoring.
- Animaciones o dependencias.
- Layout de otros juegos.

## Definition of Done

- [ ] Evidencia visual before/after (no hay no-op).
- [ ] `npm test`, `npm run lint`, `npm run build` en verde.
- [ ] Sin dependencias nuevas ni red.
- [ ] Sin regresión de arcade/SRS/TTS.
- [ ] Diff revisado por humano.
- [ ] `MEMORY.md` actualizado y `FOCUS.md` limpio.
