# Security & Persistence

- Local-first: progress/XP/history never leave the browser.
- No secrets in repo; ignore `.env*`.
- Validate all parser input; cap stored history (e.g. 1000 attempts per topic) to avoid quota errors.
- Handle `QuotaExceededError` with graceful fallback (keep in-memory, warn user).
