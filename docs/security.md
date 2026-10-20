# Security & Persistence

- Local-first: progress/XP/history never leave the browser.
- No secrets in repo; ignore `.env*`.
- Validate all parser input; cap stored history (currently 1000 attempts; spec-12 draft raises it to 5000) to avoid quota errors.
- Handle `QuotaExceededError` with graceful fallback (keep in-memory, warn user).
- spec-12 draft adds `sepect.topics.meta.v1` (topic `addedAt` only). It must fail safe on corrupt JSON/quota, never block loading the catalog.
