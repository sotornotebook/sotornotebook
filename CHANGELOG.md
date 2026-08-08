# CHANGELOG.md

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added — Project scaffold (Phases 1–3)

- Saved persistent project skill `SOTOR_NFC_JOURNAL_ENGINE` (`.claude/skills/SOTOR_NFC_JOURNAL_ENGINE/SKILL.md`) capturing the mission, privacy/offline rules, tech stack, and required task workflow for this project.
- Created folder structure: `css/`, `js/` (with `components/`, `modules/`, `storage/`, `database/` planned), `assets/` (`icons/`, `sounds/`, `animations/` planned).
- Added root files: `index.html` (app shell), `manifest.json` (PWA manifest), `service-worker.js` (minimal app-shell cache), `css/main.css` (placeholder reset), `js/main.js` (entry point, registers service worker).
- Added `.gitignore`, `README.md`.
- Added `PROJECT_STRUCTURE.md` as the architecture source of truth.
- Added `ROADMAP.md` with the full phase plan.

### Added — Storage layer (Phase 4)

- Added `js/database/schema.js`: `DB_NAME`/`DB_VERSION`, the `STORES` map (`journalEntries`, `moodLogs`, `reflections`, `timeCapsules`, `photos`, `voiceNotes`, `metadata`), and an append-only `MIGRATIONS` list.
- Added `js/database/db.js`: `openDatabase()` — opens/creates the IndexedDB connection and applies pending migrations.
- Added `js/storage/indexeddb-store.js`: generic promise-based `put`/`get`/`getAll`/`getAllByIndex`/`remove`/`clear` over any object store.
- Added `js/storage/settings.js`: LocalStorage helper for settings/theme/last-screen under a `sotor:` namespace, plus `getAllRaw`/`restoreAllRaw` for backups.
- Added `js/storage/backup.js`: `createBackup`/`downloadBackup`/`restoreBackup`/`restoreBackupFromFile` — a full local export/import of IndexedDB + settings, no network involved.
- Added `js/storage/index.js` as the single public storage API surface; feature modules must import only from here, never from `js/database/` directly.
- Updated `js/main.js` to open the local database on boot.
- Updated `PROJECT_STRUCTURE.md`: filled in the `js/storage/` and `js/database/` file trees, corrected the object-store naming convention to plural, refreshed storage flow and TODOs.

### Added — Theme engine (Phase 5)

- Added `css/themes.css`: `paper` (default), `light`, and `dark` theme presets as CSS custom properties (`--color-bg`, `--color-surface`, `--color-ink`, `--color-ink-muted`, `--color-accent`, `--color-border`), applied via `<html data-theme="...">`, with a reduced-motion-aware fade on theme change.
- Added `js/theme.js`: `THEMES`, `DEFAULT_THEME`, `initTheme()` (applies the persisted/valid theme on boot), and `setTheme()` (validates, applies, persists via the storage layer, and fires a `sotor:themechange` event for future UI).
- Updated `index.html`: added a small inline pre-paint script that reads the persisted theme from LocalStorage and sets `data-theme` before first render (avoids a flash of the wrong theme, since an ES module script would run too late); linked `css/themes.css`.
- Updated `css/main.css` to read `var(--color-bg)`/`var(--color-ink)` instead of hardcoded hex values.
- Updated `js/main.js` to call `initTheme()` on boot.
- Updated `service-worker.js`: added `css/themes.css` and `js/theme.js` to the app-shell cache list, bumped `CACHE_NAME` to `sotor-shell-v2`.
- Updated `PROJECT_STRUCTURE.md`: documented the theme flow, added the CSS custom property naming convention, and moved the Tailwind integration decision to the Design System phase (Theme Engine intentionally shipped without a build step).
