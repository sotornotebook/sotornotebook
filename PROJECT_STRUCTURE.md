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
│   ├── main.js             # Entry point: registers service worker, boots the app
│   ├── components/         # Reusable, presentation-only UI pieces (buttons, cards, sheets)
│   ├── modules/            # One folder per feature module (dashboard, journal, mood, etc.)
│   ├── storage/            # Storage-layer API: IndexedDB/LocalStorage wrappers, migrations, backup/restore
│   └── database/           # IndexedDB schema definitions and versioned migrations
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
- **Storage layer** (`js/storage/`, `js/database/`) is the only code allowed to talk to IndexedDB/LocalStorage. It exposes a small typed API (get/put/delete/list, backup, restore, migrate) that modules call.

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

- **IndexedDB** — journals, photos, voice recordings, time capsules, and their metadata. Schema and migrations live in `js/database/`.
- **LocalStorage** — settings, active theme, last-open screen, small preferences only. Never store journal content here.
- **Backup/restore** — exports/imports a single local file (e.g. JSON/zip) containing the user's IndexedDB data; implemented in `js/storage/backup.js` when the Backup/Restore module is built. No cloud step involved.

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
- IndexedDB object stores: singular, `camelCase` (e.g. `journalEntry`, `moodLog`, `timeCapsule`).

## Roadmap

See `ROADMAP.md` for phase-by-phase status.

## TODOs

- [ ] Design and add real app icons at `assets/icons/icon-192.png` and `assets/icons/icon-512.png` (manifest already references them).
- [ ] Decide Tailwind integration approach during the Theme Engine / Design System phase.
- [ ] Build the storage layer (IndexedDB wrapper + migrations).

## Project status

**Phase:** Scaffold complete. **Next phase:** Storage layer. See `ROADMAP.md`.
