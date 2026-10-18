---
feature: topics-flashcards
status: approved
owner: Eduardo
created: 2026-10-16
updated: 2026-10-16
related_tasks: tasks.md (approved — execution unblocked)
---

# Spec — Topics Hub + Modular Games Framework + Flashcards (spec-02)

## 1. Intent / Business goal
Turn Sepect from a parser demo into a topic-driven arcade: the home screen lists study
**topics** (e.g., "Funciones en Programación", "Algoritmos", "Inglés básico"), the learner
enters a topic and picks a **game** for it. This increment delivers the topics hub, the
modular game-module framework with stable game IDs, and the first game (**Flashcards**),
reusable with any topic deck (programming concepts or vocabulary in other languages).
Every future game (memorama, ahorcado, sopa de letras, …) plugs into the same registry
contract without touching topic/content code — see `specs/roadmap-games.md`.
Every card also carries a visual image — code-generated (algorithmic SVG / emoji),
user-provided (emoji / URL / upload) or an automatic algorithmic fallback tile — so no
card ever renders without a visual identity.

## 2. User stories & use cases
- As a learner, I want a home with my topics as cards, so that I enter the one I'm studying today.
  - Use case: `#/` → cards for each topic (builtin + custom) with title + card count; empty → "No topics yet" + create action.
- As a learner, I want to create a topic by pasting Markdown notes, so that a new category appears without code changes.
  - Use case: paste MD → `parseTopic` → invalid lines counted → valid topic saved (custom, localStorage) → visible after reload.
- As a learner, I want to open a topic and see its games, so that I can pick one.
  - Use case: `#/tema/:topicId` → game grid; `available` games open, `soon` games disabled with "Próximamente".
- As a learner, I want Flashcards (term on the front, meaning/translation on the back), so that I can self-test.
  - Use case: front = image + `front`, flip (click/Space/Enter) → back = `back` + same image + grades (Otra vez / Difícil / Fácil) → next card → session summary.
- As a learner, I want my grades to feed XP + spaced repetition, so that hard cards resurface sooner.
  - Use case: grade → `applyGrade` (SM-2) + XP + history persisted → reload shows same SRS state/XP.
- As a learner of languages **and** of technical subjects, I want the same game to work with any topic's deck.
  - Use case: Flashcards plays a programming deck (es) and a language deck (es→en) with zero game-code changes.
- As a learner, I want every card to show a related image, so that I recognize words and concepts faster.
  - Use case: card with `I:` token or UI override renders its image; without any source → auto-emoji (known word) or generated fallback tile; broken source → fallback (never a broken icon).
- As a learner creating my own topic, I want to attach an image per card (emoji, URL or upload), so that my personal deck is visual too.
  - Use case: create-topic modal → per-card image slot (suggested emoji / URL field / upload with preview) → saved with the topic → visible after reload.
- As a mobile user, I want the hub, topic view and flashcards usable with one thumb + keyboard.
  - Use case: 360px viewport + Tab/Enter/Space only → all actions reachable, targets ≥44px, no horizontal scroll.

## 3. Acceptance criteria (binary)
- [ ] AC-1: `#/` lists every topic (builtin + custom) as a card with title + card count; with zero topics it shows "No topics yet" and a create action; no crash.
- [ ] AC-2: Creating a topic from pasted Markdown saves it (`sepect.topics.custom.v1`), shows parsed card count + error count, dedupes id with `-2` suffix on collision, and survives reload; 0 valid cards → creation rejected with message.
- [ ] AC-3: `#/tema/:id` shows topic title + game grid from the registry; `status:'available'` games are openable; `status:'soon'` are disabled and labeled "Próximamente"; unknown topic/route → fallback screen with link home (no crash).
- [ ] AC-4: Registry contract: `getGame('flashcards').status === 'available'`; `getGame('memorama').status === 'soon'`; `getGame('nope') === null`; `listGames()` returns the full ordered catalog; adding a game later requires only one module folder + one registry entry.
- [ ] AC-5: Flashcards: front shows `front`, back shows `back`; grading (`otra-vez|dificil|facil`) updates that card's SRS state via `scheduleNext` and XP (facil=+10, dificil=+25, otra-vez=0); SRS + XP + history are identical after simulated reload.
- [ ] AC-6: Reuse/isolation: the flashcards module has no imports of storage, parser, content or router (test-enforced) and completes a session correctly with ≥2 different decks (programming es fixture + language es→en fixture).
- [ ] AC-7: Keyboard/mobile: hub, create-topic modal, topic view and flashcards are fully operable with Tab/Enter/Space (flip + nav + grade), visible focus ring, targets ≥44px, no horizontal scroll at 360px.
- [ ] AC-8: `npm test` 100% pass and `npm run lint` 0 errors/warnings on shipped files.
- [ ] AC-9: Any card rendered by any game shows an image resolved by precedence (topic UI override > MD `I:` token > auto-emoji dictionary > generated fallback art tile); a missing or broken image never renders blank/broken — fallback tile appears instead; every rendered image has accessible `alt` text.
- [ ] AC-10: `node scripts/generate-card-images.mjs` (zero deps) reads a topic MD and writes exactly one deterministic SVG per card lacking an image to `src/content/assets/<topicId>/<cardId>.svg` (same input → identical bytes on re-run), skips existing assets unless `--force`; after T11, `funciones-programacion` has 100% of cards with an image source.
- [ ] AC-11: Custom-topic UI supports per-card images: auto-suggested emoji, URL field, and file upload with preview; uploads persist to IndexedDB `sepect.images.v1` and survive simulated reload; pasted MD `| I:` tokens are honored; IndexedDB quota/unavailable → fallback placeholder + non-blocking message.

> Each AC maps to at least one automated test in §6. AC-7 also uses the manual checklist.

## 4. Architectural constraints
- Stack / patterns: Vite 5 + React 18 + Tailwind; layering per `docs/architecture.md`. No new dependencies (hash mini-router + native Canvas art in-house).
- Routing: `src/app/router.js` — hash-based. Routes (frozen): `#/` (hub), `#/tema/:topicId`, `#/tema/:topicId/juego/:gameId`. Unknown → not-found view.
- Game module framework (contract frozen once shipped):
  - Registry `src/games/registry.js` entries: `{ id, title, description, status: 'available'|'soon', minCards, load? }`; `load()` is a dynamic import resolving `{ default: Component }`. `soon` entries have no `load`.
  - Game IDs are kebab-case and stable; reserved: `flashcards`, `memorama`, `ahorcado`, `sopa-de-letras`, `quiz-significado`, `caza-significados`, `intruso`, `lluvia-meteoros`, `conecta-pares`, `serpiente-significados`.
  - Game Component props (frozen): `{ deck: Card[], onGrade(cardId, grade) -> { gained, total }, onExit() }`. Games never import storage/parser/content/router; they receive data and emit results.
  - Arcade/canvas games may internally reuse the core engine, but externally honor this same contract.
- Content pipeline: `parseMarkdown` (unchanged, frozen) stays the only raw-MD parser; `parseTopic(md)` wraps it → `{ topic:{id,title,description}, cards: Card[], errors[] }`. `Card = { id, front, back, difficulty, image? }`. Builtin topics: `src/content/topics/*.md` via Vite `?raw` glob; custom topics: localStorage `sepect.topics.custom.v1` storing `{ id, title, md }`, reparsed on load. Catalog service merges + dedupes by id (builtin wins; custom duplicate gets suffix).
- Card image model: `Card.image?: { kind: 'emoji'|'url'|'asset'|'upload', value: string }`; built by pure `resolveCardImage(card, topicOverrides, emojiDict)` with precedence: topic UI override > MD `| I:` token > auto-emoji dictionary > generated fallback. MD token forms: emoji (`| I: 🐶`), `https://…` or `asset:<topicId>/<cardId>.svg`; absent → `undefined` (backward compatible).
- Shared `src/components/CardImage.jsx`: renders every card visual with accessible `alt`; fallback = deterministic generative tile drawn once with **native Canvas** (seed = card id, no rAF, respects `prefers-reduced-motion`, DPR ≤2). p5.js is NOT added (skill default: native Canvas, 0 KB extra); optional future only with explicit human approval. Games rendering cards MUST render them through `CardImage` (applies to Flashcards now and every future game).
- Builtin card assets: `src/content/assets/<topicId>/<cardId>.svg` produced by `scripts/generate-card-images.mjs` (Node, zero deps, seeded PRNG, byte-deterministic; skips human-provided assets unless `--force`).
- Custom topic images: uploads stored as blobs in IndexedDB `sepect.images.v1`; per-card overrides persisted with the topic (`topic.images[cardId]`), MD never rewritten. `CardImage` creates/revokes object URLs per mount.
- Persistence: existing `sepect.profile.v1` untouched shape; new `sepect.srs.v1` = `{ [topicId]: { [cardId]: { interval, ease, reps, nextReview } } }`. Quota-safe pattern reused from store.
- Session order: `orderDeck(cards, srs, now)` → unseen first (content order), then `nextReview` ascending; whole deck playable. `now` injectable for tests.
- Performance: single-card DOM render (no full-deck DOM); canvas DPR ≤2; first paint informative < 1.5s mid mobile.
- Spanish UI strings; identifiers/code in English (per MEMORY 2026-10-16).

## 5. Edge cases & error handling
- Topic with 0 valid cards → creation rejected ("No se encontraron preguntas válidas"), nothing persisted.
- Malformed MD lines → counted in errors, parsing continues (existing parser behavior); topic still creatable if ≥1 valid card.
- Duplicate topic id → suffix `-2`, `-3` (custom never shadows builtin).
- Unknown topic / unknown game / malformed hash → fallback view with link home; never throws.
- Deck of 1 card → session works (next stays on same card, session finishes after grade).
- Grade on card with no prior SRS state → default `{ interval:1, ease:2.5, reps:0 }` baseline.
- Corrupt `sepect.srs.v1` / `sepect.topics.custom.v1` / `sepect.images.v1` JSON/stores → ignored, defaults restored, no crash.
- localStorage quota exceeded → in-memory fallback + console warn (existing store pattern).
- Image URL broken / asset missing → fallback tile; never a broken-image icon.
- Uploaded file too large (>2 MB) → rejected with message; card keeps emoji/URL/fallback.
- IndexedDB unavailable or quota exceeded → placeholder + non-blocking message (never blocks the session).
- SVG with emoji glyph on a font-less renderer → initials/pattern remain visible (design degrades gracefully).
- Very large deck (500 cards) → flashcards keeps only current card in DOM (no freeze).

## 6. Test contract
| Interface | Input | Output | Test file |
|---|---|---|---|
| `parseTopic(md)` | §6 fixture A | `{ topic:{id:'funciones-en-programacion',title,description}, cards: Card[3], errors:string[1] }` | `src/core/parser/parser.test.js` (extend; `parseMarkdown` tests stay green) |
| `parseTopic(md)` with images | §6 fixture C | cards carry `image:{kind:'emoji'}` / `{kind:'url'}`; absent token → `undefined` | `src/core/parser/parser.test.js` |
| `slugify(text)` + dedupe | `'Funciones en Programación'` ×2 | `'funciones-en-programacion'`, then `'-2'` | `src/core/content/catalog.test.js` |
| `buildCatalog(builtinMd, customTopics)` | fixture A + custom | merged, order builtin→custom, unique ids | `src/core/content/catalog.test.js` |
| `resolveCardImage(card, overrides, emojiDict)` | fixture C cards + override + dict | precedence exact (override > I: > emoji > fallback); none → `{kind:'fallback'}` | `src/core/content/image.test.js` |
| `CardImage` render | image / broken URL / no image | `<img>` with `alt` / fallback tile with `alt` | `src/components/CardImage.test.jsx` |
| `generate-card-images.mjs` | fixture C MD → run twice | one SVG per missing image, byte-identical; existing skipped; `--force` overwrites | `scripts/generate-card-images.test.mjs` |
| `images.js` (IndexedDB mock) | save blob → reload | same key resolves after reload; quota/unavailable → fallback result | `src/core/storage/images.test.js` |
| `getGame / listGames` | `'flashcards'` / `'memorama'` / `'nope'` | available / soon / null; catalog length 10 | `src/games/registry.test.js` |
| `parseHash(hash)` | `'#/tema/funciones/juego/flashcards'`; `'#/x'` | `{view:'game',topicId,gameId}`; `{view:'notFound'}` | `src/app/router.test.js` |
| `orderDeck(cards, srs, now)` | 3 cards, 1 reviewed due | unseen first, then earliest `nextReview` | `src/core/repetition/srs.test.js` |
| `applyGrade(srs, topicId, cardId, grade)` | grade `facil` on unseen card | state = `scheduleNext` output; persisted deep-equal after reload (mocked storage) | `src/core/repetition/srs.test.js` |
| flashcards reducer | sequence flip/grade/nav | counts + index + flipped deterministic | `src/games/flashcards/flashcards.logic.test.js` |
| isolation scan | flashcards folder source | no `storage|parser|content|router` imports | `src/games/flashcards/flashcards.isolation.test.js` |
| a11y/touch | keyboard-only + 360px | keyboard checklist + component test (incl. image `alt`) | `src/games/flashcards/Flashcards.a11y.test.jsx` + manual checklist |

Fixture A (parser):
```md
# Funciones en Programación
Una función encapsula lógica reutilizable y evita repetir código.

- Q: ¿Qué es una función? | A: Bloque de código reutilizable que realiza una tarea | E: easy
- Q: ¿Qué es un parámetro? | A: Variable que recibe valores de entrada | E: easy
- Q: ¿Qué es el valor de retorno? | A: Resultado que la función devuelve al llamador | E: hard
- LINEA SIN MARCADORES
```

Fixture B (reuse, language es→en, inline in tests):
```md
# Inglés básico
- Q: dog | A: perro
- Q: house | A: casa
- Q: apple | A: manzana
```

Fixture C (images, inline in tests):
```md
# Animales
- Q: dog | A: perro | I: 🐶
- Q: house | A: casa | I: https://example.com/house.png
- Q: book | A: libro
```

## 7. Out of scope
- Games 2–10 (memorama, ahorcado, sopa-de-letras, quiz-significado, caza-significados, intruso, lluvia-meteoros, conecta-pares, serpiente-significados) — each gets its own spec; registry already lists them as `soon`.
- Editing/deleting topics after creation; topic import/export.
- Audio/TTS, AI-generated raster (photorealistic) images, multiplayer, Stats view.
- p5.js dependency (generated art uses native Canvas, 0 KB; p5 needs separate approval).
- Obsidian sync, ADB, deployment, PWA, backend.
- Dashboard (spec-01) redesign: it stays reachable until hub replaces it as `/`.

## 8. Human sign-off
- [x] Reviewed and approved by: Eduardo — date: 2026-10-16 (incl. images addendum, same date)
