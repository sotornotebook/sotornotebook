# PROJECT_STRUCTURE.md

Single source of truth for the SOTOR NFC Portal. Read this before every task; update it whenever the architecture changes.

## Folder tree

```
sotornotebook/
├── index.html              # App shell, single entry point
├── manifest.json           # PWA manifest (installable, NFC scan target)
├── service-worker.js       # Offline app-shell cache
├── README.md
├── PROJECT_STRUCTURE.md    # This file
├── ROADMAP.md
├── CHANGELOG.md
├── css/
│   └── main.css            # Global styles (Tailwind adopted in Design System phase)
├── js/
│   ├── main.js             # Entry point: registers service worker, opens the DB, boots the app
│   ├── components/         # Reusable, presentation-only UI pieces (buttons, cards, sheets)
│   ├── modules/            # One folder per feature module (dashboard, journal, mood, etc.)
│   ├── storage/            # Public storage API — the only thing feature modules import
│   │   ├── index.js        # Barrel export of the public storage API
│   │   ├── indexeddb-store.js  # Generic promise-based CRUD over any object store
│   │   ├── settings.js     # LocalStorage helper: settings, theme, last screen, preferences
│   │   └── backup.js       # Export/import a full local backup (IndexedDB + settings)
│   └── database/           # IndexedDB schema + versioned migrations (internal, not imported by modules)
│       ├── schema.js       # DB_NAME, DB_VERSION, STORES, MIGRATIONS
│       └── db.js           # openDatabase(): opens/creates/migrates the connection
└── assets/
    ├── icons/              # App icons, in-app iconography
    ├── sounds/             # Optional ambient/interaction sounds
    └── animations/         # Lottie/JSON or CSS animation assets
```

## Architecture

- **Static, single-page app.** `index.html` is the only HTML document; `js/main.js` boots the app into `#app`. No server-side rendering, no build-required framework.
- **Router** (to be added in the Routing phase) will live in `js/modules/router.js` or similar and switch views inside `#app` based on in-app state — no server routes exist, so deep links must be handled client-side with the History API or hash routing.
- **Feature modules** (`js/modules/<name>/`) own their own view + logic and talk to `js/storage/` — they never touch `indexedDB`/`localStorage` directly.
- **Components** (`js/components/`) are dumb/reusable render helpers shared across modules. They hold no persistence logic.
- **Storage layer** (`js/storage/`, `js/database/`) is the only code allowed to talk to IndexedDB/LocalStorage. `js/database/` is internal (schema + migrations); modules only ever import from `js/storage/index.js`, which exposes `put`/`get`/`getAll`/`getAllByIndex`/`remove`/`clear`, the settings helpers, and backup/restore.

## Dependencies

None (no npm packages, no CDN frameworks). Tailwind CSS will be introduced during the **Theme engine / Design system** phase — the exact integration method (CDN vs. compiled build) is decided in that task, not before.

## Data flow

```
User action (UI)
   → Module (js/modules/<name>)
      → Storage API (js/storage/*)
         → IndexedDB / LocalStorage (js/database schema)
      ← data
   ← re-render
```

No data ever leaves the device. There is no network call in the data path.

## Storage flow

- **IndexedDB** (`sotor-db`, see `js/database/schema.js`) — object stores `journalEntries`, `moodLogs`, `reflections`, `timeCapsules`, `photos`, `voiceNotes`, and the key/value `metadata` store. Schema changes are additive migrations in `MIGRATIONS`; never edit a migration that has already shipped.
- **LocalStorage** (`js/storage/settings.js`) — settings, active theme, last-open screen, small preferences only, namespaced under the `sotor:` prefix. Never store journal content here.
- **Backup/restore** (`js/storage/backup.js`) — `createBackup()`/`downloadBackup()` snapshot every IndexedDB store plus all `sotor:`-namespaced settings into one JSON file; `restoreBackup()`/`restoreBackupFromFile()` replace local data from that file. No cloud step involved — the Backup/Restore *module* (UI) still needs to be built on top of this in its own task.

## Navigation flow

```
NFC scan → index.html loads → service worker serves cached shell if offline
   → storage layer opens local DB → resume last session / show daily greeting
   → Dashboard → selected module (Journal, Mood, Calendar, ...)
```

Maximum 3 taps from Dashboard to any feature (see SKILL: SOTOR_NFC_JOURNAL_ENGINE, UX rules).

## Coding rules

- Vanilla JS ES Modules only — no bundler-required syntax (no JSX, no TS) unless explicitly requested.
- Modules communicate through the storage API, never through globals.
- No feature reaches the network. If a task seems to need one, stop and flag it.
- Keep functions small and documented only where the *why* isn't obvious from the code.
- Every new feature module updates this file's folder tree and data-flow sections if it changes them.

## Naming conventions

- Files and folders: `kebab-case` (e.g. `js/modules/mood-tracker/`).
- JS exports: `camelCase` for functions/variables, `PascalCase` only for factory/class-like constructors.
- CSS: Tailwind utility classes in markup; any custom classes in `css/main.css` use `kebab-case` prefixed `sotor-` (e.g. `.sotor-card`).
- IndexedDB object stores: plural, `camelCase` (e.g. `journalEntries`, `moodLogs`, `timeCapsules`) — each store holds many records. Exception: `metadata` is a singular key/value store, not a record collection.

## Roadmap

See `ROADMAP.md` for phase-by-phase status.

## TODOs

- [ ] Design and add real app icons at `assets/icons/icon-192.png` and `assets/icons/icon-512.png` (manifest already references them).
- [ ] Decide Tailwind integration approach during the Theme Engine / Design System phase.
- [ ] Build the Backup/Restore *module* (UI) on top of `js/storage/backup.js`.

## Project status

**Phase:** Storage layer complete. **Next phase:** Theme engine. See `ROADMAP.md`.
