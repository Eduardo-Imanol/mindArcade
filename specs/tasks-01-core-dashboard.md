# tasks.md — core-dashboard (APPROVED 2026-10-16 — execution unblocked)

> Derived from `specs/spec-01-core-dashboard.md`. No execution until human signs both.
> Sign with: `APPROVED spec-01 + tasks`

## Dependency graph

```
T0-scaffold ---> T1-parser ---> T5-ui-tokens
      |              |                |
      +---> T2-sm2 --+                |
      |              |                v
      +---> T3-storage --------------> T6-dashboard ---> T7-verify
      +---> T4-engine ------------------^
```

Base (schemas/types/scaffold) first. UI after core logic. Verify last.

## Tasks

### T0 — Scaffold Vite+React+Tailwind+Vitest [depends: none] ✅
- [x] Deliverable: `package.json`, `vite.config.js`, `tailwind.config.js`, `src/main.jsx`, `index.html`
- Covers: AC-1 (boot), AC-8 (tooling)
- Context needed: `AGENTS.md`, `docs/architecture.md`
- Done when: `npm run dev` boots empty Dashboard route; `npm test` runs (0 tests pass); `npm run lint` clean

### T1 — Topic parser Markdown→Question[] [depends: T0] ✅
- [x] Deliverable: `src/core/parser/parser.js` + `parser.test.js`
- Covers: AC-2 + edge: empty input, malformed line
- Context needed: spec §6 fixture + `Question` shape
- Done when: fixture → 3 questions + 1 error, never throws; empty → 0 + message path

### T2 — SM-2 scheduler simplified [depends: T0] ✅
- [x] Deliverable: `src/core/repetition/sm2.js` + `sm2.test.js`
- Covers: AC-3
- Context needed: spec §6 rows 2-3
- Done when: fail decreases interval; easy×2 strictly increases

### T3 — Store XP/streak + persistence [depends: T0] ✅
- [x] Deliverable: `src/core/storage/store.js`, `xp.js` + `xp.test.js`, `persistence.test.js`, `persistence.test.js`
- Covers: AC-4, AC-5 + quota-exceeded fallback
- Context needed: spec §4 persistence constraints
- Done when: hard>easy XP, wrong=+0; save/load deep-equal; quota fallback warns without crash

### T4 — Engine single-loop + auto-pause [depends: T0] ✅
- [x] Deliverable: `src/core/engine/engine.js` + `engine.test.js`
- Covers: AC-6 + double-start no-op, dt clamp 100ms
- Context needed: `docs/architecture.md` engine invariants
- Done when: one rAF handle; hidden→paused; resume dt clamped

### T5 — Neon tokens + Button/Card/Modal [depends: T0] ✅
- [x] Deliverable: `src/ui/tokens.css`, `src/components/{Button,Card,Modal}.jsx`
- Covers: AC-1 (tokens), AC-7 (focus ring)
- Context needed: colors #0f051d/#00ffcc/#ff007f/#39ff14, targets ≥44px
- Done when: visual tokens match; components render with visible `:focus-visible`

### T6 — Dashboard view + parser preview + due list [depends: T1,T2,T3,T4,T5] ✅
- [x] Deliverable: `src/views/Dashboard.jsx` + `Dashboard.a11y.test.jsx`
- Covers: AC-1, AC-7, integration of T1-T4
- Context needed: all T1-T5 outputs
- Done when: paste fixture → preview 3 Q + error count; Due-today list renders; keyboard-only operable, no trap

### T7 — Adversarial verify + DoD [depends: T6] ✅
- [x] Deliverable: full suite green, lint clean, human diff review
- Covers: AC-8 (100% tests + 0 lint)
- Context needed: `docs/testing.md`, `docs/security.md`
- Done when: `npm test` 100% pass; `npm run lint` 0 errors; independent verifier signs; human approves diff

## Sizing / execution flow
- Scope: medium (7 atomic tasks, 1 vertical slice)
- Mode: single-agent sequential (T0→T1..T4 parallelizable →T5→T6→T7)
- Parallelizable groups: T1 || T2 || T3 || T4 (after T0)
- Estimate: T0 M, T1-T4 S each, T5 S, T6 M, T7 S
- Out of scope respected: no mini-games, no Obsidian/ADB/deploy, no p5, no backend

## Sign-off
- [x] Approved by: Eduardo — date: 2026-10-16
