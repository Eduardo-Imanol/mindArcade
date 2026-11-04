# Security & Persistence

- Local-first: progress/XP/history/arcade records never leave the browser.
- No secrets in repo; ignore `.env*`.
- Validate all parser input; cap stored history at 5000 attempts to avoid quota errors.
- Handle `QuotaExceededError` with graceful fallback (keep in-memory, warn user).
- spec-12 adds `sepect.topics.meta.v1` (topic `addedAt` only). It must fail safe on corrupt JSON/quota, never block loading the catalog.
- spec-18 adds `sepect.arcade.v1` as the only arcade key: `{ best, runs }` per
  `topicId:gameId:deckId`, last 20 runs. IDs are trimmed, counters floored to
  non-negative integers, dates normalized to ISO, invalid runs dropped, corrupt JSON
  → `{}` and quota failure → `{ ok: false }` while the run stays in memory. It never
  reads or writes `sepect.srs.v1`, `sepect.profile.v1` or XP/history; deck mastery is
  derived from SRS and is not persisted separately.
- spec-21 adds `sepect.exercises.v1` as the only exercise-progress key. It is
  isolated from SRS/profile/arcade (does not duplicate mastery), sanitizes IDs and
  counters, treats corrupt JSON as `{}` and quota failure as `{ ok: false }` without
  breaking play. Code execution runs in a `sandbox="allow-scripts"` iframe without
  same-origin and CSP `default-src 'none'`, so user code cannot touch storage or the app.
- spec-23 audits the existing keys (`sepect.srs.v1`, `sepect.profile.v1`,
  `sepect.settings.v1`, `sepect.arcade.v1`, `sepect.exercises.v1`,
  `sepect.topics.custom.v1`, `sepect.topics.meta.v1`) with no collisions or
  migrations; old data normalizes on read, `#/configuracion` is read-only and writes
  no key. No new network, secrets or backend.
