# ROADMAP.md

Implementation follows this fixed order (see `PROJECT_STRUCTURE.md` for the architecture each phase produces). One phase's tasks are built as several small, independent tasks — never all at once.

- [x] **1. Project scaffold** — folder structure created.
- [x] **2. Root files** — `index.html`, `manifest.json`, `service-worker.js`.
- [x] **3. PROJECT_STRUCTURE.md** — architecture documented.
- [x] **4. Storage layer** — IndexedDB wrapper (`js/database/`), LocalStorage helpers, migrations, backup/restore (`js/storage/`).
- [ ] **5. Theme engine** — light/dark/paper themes, persisted in LocalStorage, decide Tailwind integration. ← **next task**
- [ ] **6. Design system** — Tailwind config/tokens, typography, spacing, motion primitives.
- [ ] **7. Shared components** — buttons, cards, sheets, nav bar, empty states (`js/components/`).
- [ ] **8. Routing** — client-side view switching, deep link to last screen.
- [ ] **9. Feature placeholders** — empty shells for every module wired into routing/dashboard.
- [ ] **10. Individual modules** (one task each):
  - [ ] Dashboard
  - [ ] Daily Journal
  - [ ] Voice Journal
  - [ ] Mood Tracker
  - [ ] Reflection
  - [ ] Time Capsule
  - [ ] Calendar
  - [ ] Gallery
  - [ ] Search
  - [ ] Statistics
  - [ ] Settings
  - [ ] Backup / Restore
  - [ ] Themes (UI for theme engine built in phase 5)

## Current status

Phase 4 complete (storage layer: IndexedDB schema/migrations, generic CRUD, LocalStorage settings, backup/restore, wired into `js/main.js`). Recommended next task: **Theme engine** (phase 5) — light/paper/dark theme definitions persisted via `js/storage/settings.js`, and a decision on the Tailwind integration method.
