# ROADMAP.md

Implementation follows this fixed order (see `PROJECT_STRUCTURE.md` for the architecture each phase produces). One phase's tasks are built as several small, independent tasks — never all at once.

- [x] **1. Project scaffold** — folder structure created.
- [x] **2. Root files** — `index.html`, `manifest.json`, `service-worker.js`.
- [x] **3. PROJECT_STRUCTURE.md** — architecture documented.
- [x] **4. Storage layer** — IndexedDB wrapper (`js/database/`), LocalStorage helpers, migrations, backup/restore (`js/storage/`).
- [x] **5. Theme engine** — light/dark/paper themes as CSS custom properties, persisted in LocalStorage, applied without a flash of the wrong theme.
- [ ] **6. Design system** — Tailwind config/tokens (wired to the theme engine's CSS variables), typography, spacing, motion primitives. ← **next task**
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

Phase 5 complete (theme engine: `paper`/`light`/`dark` tokens in `css/themes.css`, `js/theme.js` for init/switch/persist, pre-paint inline script in `index.html` to avoid a flash of the wrong theme). Recommended next task: **Design system** (phase 6) — decide and integrate Tailwind (CDN vs. compiled build), wire its config to the `--color-*` tokens already defined, and establish typography/spacing/motion primitives.
