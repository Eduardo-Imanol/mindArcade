---
feature: core-dashboard
status: approved
owner: Eduardo
created: 2026-10-16
updated: 2026-10-16
related_tasks: tasks.md (approved — execution unblocked)
---

# Spec — Sepect Nucleus + Neon Dashboard (spec-01)

## 1. Intent / Business goal
Provide the minimal playable Sepect vertical slice: a local-first core (game loop, store/XP,
SM-2 scheduler, Markdown topic parser) plus a neon arcade Dashboard, so that a student can
load study notes, earn XP, and see scheduled reviews — before any full mini-game is built.

## 2. User stories & use cases
- As a student, I want to paste Markdown notes so that they become playable questions.
  - Use case: notes (valid + invalid lines) → parser → `questions[]` rendered in Dashboard preview + error count.
- As a student, I want to earn XP and streaks so that daily study is rewarded.
  - Use case: answer recorded → XP += f(difficulty) → persisted → survives reload.
- As a student, I want reviews scheduled intelligently so that hard topics reappear sooner.
  - Use case: grade (fail/hard/easy) → nextReview computed by SM-2 → Dashboard "Due today" list.
- As a player, I want pause on tab-hide so that timers/scores never cheat.
  - Use case: state=playing + `visibilitychange=hidden` → state=paused → resume restores dt=0.
- As a mobile user, I want a neon Dashboard usable with one thumb + keyboard.
  - Use case: 360px viewport + Tab/Enter/Space only → all actions reachable, targets ≥44px.

## 3. Acceptance criteria (binary)
- [x] AC-1: Vite dev boots with `/` rendering Dashboard with neon tokens (#0f051d bg, #00ffcc/#ff007f/#39ff14 accents).
- [x] AC-2: Parser converts the fixture in §6 into exactly 3 valid questions + 1 reported error, never throwing.
- [x] AC-3: SM-2: grade `fail` → interval decreases vs previous; grade `easy` twice → interval strictly increases.
- [x] AC-4: XP: correct hard answer awards strictly more XP than correct easy answer; wrong awards 0.
- [x] AC-5: Reload persistence: XP + streak + history recorded before reload equal values read after reload.
- [x] AC-6: Engine: single active rAF loop per session; `hidden` event forces `paused`; resume does not jump time (dt clamped ≤100ms).
- [x] AC-7: Keyboard: all Dashboard actions operable via Tab/Enter/Space; visible focus ring; no keyboard trap.
- [x] AC-8: `npm test` 100% pass and `npm run lint` 0 errors/warnings on shipped files.

> Each AC maps to at least one automated test in §6.

## 4. Architectural constraints
- Stack / patterns: Vite 5 + React 18 + Tailwind; `src/core|components|views|games|ui` layering per `docs/architecture.md`.
- Game interface: games implement `BaseMiniGame` (`init/update/render/dispose`); games never import storage.
- Audio: Web Audio API synthesized only; global mute toggle; no autoplay before user gesture.
- Performance: animations via transform/opacity only; canvas DPR ≤ 2; dashboard first paint < 1.5s on mid mobile (informative, not gated).
- Persistence: localStorage = profile/XP/streak; IndexedDB = attempt history; no network for progress.

## 5. Edge cases & error handling
- Empty notes input → 0 questions + message "No questions found", no crash.
- Malformed line (`- ???`) → skipped, counted in `errors[]`, parsing continues.
- Storage quota exceeded → in-memory fallback + console warn + non-blocking banner.
- Double engine `start()` → second call is no-op, still one loop.
- `update(dt)` with dt > 100ms (background tab) → clamped to 100ms.

## 6. Test contract
| Interface | Input | Output | Test file |
|---|---|---|---|
| `parseMarkdown(md: string)` | fixture below | `{ questions: Question[3], errors: string[1] }` | `src/core/parser/parser.test.js` |
| `scheduleNext(card, grade)` | `{ interval: 6, ease: 2.5 }, 'fail'` | `next.interval < 6` | `src/core/repetition/sm2.test.js` |
| `scheduleNext(card, grade)` | easy × 2 from `{ interval: 1, ease: 2.5 }` | second interval > first | `src/core/repetition/sm2.test.js` |
| `awardXP(profile, result)` | `{ correct: true, difficulty: 'hard' }` vs `'easy'` | `xpHard > xpEasy; wrong → +0` | `src/core/storage/xp.test.js` |
| `store.save/load` | profile + 2 attempts | deep-equal after reload (mocked storage) | `src/core/storage/persistence.test.js` |
| `engine.start/pause/resume` | `document.hidden` simulation | `state==='paused'`, single rAF handle | `src/core/engine/engine.test.js` |
| Dashboard a11y | keyboard-only run | all buttons reachable, focus visible | manual checklist + `views/Dashboard.a11y.test.jsx` |

Parser fixture:
```md
# Go pointers
- Q: What does `&x` return? | A: address of x | E: easy
- Q: What does `*p` do? | A: dereferences p | E: hard
- Q: Zero value of a pointer? | A: nil
- BROKEN LINE WITHOUT QA MARKERS
```

`Question = { id: string, prompt: string, answer: string, difficulty: 'easy'|'hard', topic: string }`

## 7. Out of scope
- Full mini-games (flashcard-quest, code-invaders, canvas-drag) — separate specs.
- Obsidian sync, ADB testing, deployment pipeline, PWA service worker.
- p5.js integration (native Canvas only in this slice).
- Backend, accounts, cloud sync.

## 8. Human sign-off
- [x] Reviewed and approved by: Eduardo — date: 2026-10-16
