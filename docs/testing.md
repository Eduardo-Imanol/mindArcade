# Testing

- Runner: Vitest. Logic tests use fixed seeds/dates (`now` passed explicitly), no randomness.
- Scope spec-01: parser, SM-2/Elo, XP/streak, engine state machine.
- Done = 100% tests + eslint/prettier clean (see `docs/security.md` for persistence tests).

## spec-12 (implemented; human sign-off pending)

Cover these contracts:

- **Parser**: topic description is returned complete (no 160-char slice), multi-paragraph,
  headings/code/card lines excluded; empty description stays `''`.
- **Content**: `ensureTopicMeta` persists `addedAt` once in `sepect.topics.meta.v1`;
  corrupt/quota-safe fallback; `topicCoverCard` prefers first card with explicit image.
- **Learning**: `new` (no state or `reps=0`), `learning` (`reps 1–2`), `learned`
  (`reps >= 3`), including invalid `reps`.
- **Selection**: `selectStudyCards` returns unlearned cards first, then learned cards
  with `nextReview <= now` ordered by `nextReview`; never not-due learned cards; honors
  `count` and a deterministic `random`.
- **Metrics**: exact fixtures for per-topic and global totals, `progress`, `daysStudied`,
  `accuracy`, XP (old attempts derive `facil=10`, `dificil=25`, `otra-vez=0`), UTC day
  keys, 14-day activity with zero days, empty/corrupt history.
- **GameHost/availability**: games receive only eligible cards; a card learned in one
  game is not offered again until due; no eligible cards → «Todo al día» and the game
  never mounts; `intruso` groups use eligible counts per topic.
- **Registry**: `defineGame` freezes definitions; 8 available games; reuse matrix with
  two different decks; no hardcoded «Funciones» text in `src/games/**`.
- **Views**: hub header without «Sepect», search/sort/filter helpers, topic covers,
  full description without `line-clamp`, game tiles without descriptions, dashboard
  KPIs/activity/empty states, `#/progreso` route.
- **a11y**: `role="progressbar"` with `aria-valuenow`, native controls, labels, focus;
  `TopicsHub.a11y.test.jsx`, `TopicView.a11y.test.jsx`, `Dashboard.a11y.test.jsx`
  cover accessible names, 44 px target CSS, no description truncation, responsive
  360 px reflow regexes and `prefers-reduced-motion`; the no-horizontal-scroll check
  is completed by a human via `docs/manual-a11y-checklist.md`.
- **Hub meta**: `TopicsHub` calls `ensureTopicMeta` so built-in topics persist their
  first-seen `addedAt` (test: stable across remounts).

## spec-14 (implementada; revisión de diff pendiente)

- **Arte por tema**: `scripts/generate-topic-art.test.mjs` descubre todos los
  `src/content/topics/*.md` y valida cobertura de sketches, huérfanos de sketch y de
  SVG, paridad assets↔cartas, calidad accesible (512×512, `role="img"`, `<title>`,
  `aria-label`, <200 KB), determinismo byte a byte y el ciclo de `generateArt`
  (escribe, omite sin `--force`, reporta faltantes). Sin números ni temas fijos.
- **Fixtures**: el mismo archivo se ejecuta con un tema y con dos temas sintéticos en
  un directorio temporal, y comprueba que un asset ausente, un SVG sobrante, un
  sketch huérfano o una carta sin sketch se reportan con tema y carta.
