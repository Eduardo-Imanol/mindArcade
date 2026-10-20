# Testing

- Runner: Vitest. Logic tests use fixed seeds/dates (`now` passed explicitly), no randomness.
- Scope spec-01: parser, SM-2/Elo, XP/streak, engine state machine.
- Done = 100% tests + eslint/prettier clean (see `docs/security.md` for persistence tests).

## spec-12 (draft)

Cover these contracts when the spec is signed:

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
  manual checklist in `docs/manual-a11y-checklist.md`.
