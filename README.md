# SOTOR Portal

A private, offline, NFC-powered digital companion for the SOTOR paper notebook.

The notebook is the product. This website only extends the paper experience — scan the notebook's NFC tag, the site opens instantly, and you continue where you left off. Everything stays on your device.

## Principles

Privacy first. Offline first. Mobile first. No login, no cloud, no ads, no analytics, no tracking. See `.claude/skills/SOTOR_NFC_JOURNAL_ENGINE/SKILL.md` for the full set of rules this project is built under.

## Tech stack

HTML5, Tailwind CSS, vanilla JavaScript (ES Modules), IndexedDB, LocalStorage, Service Worker, Web App Manifest — deployed as a static site on Vercel. No frameworks, no backend.

## Running locally

This is a static site — any static file server works:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL in a browser. Note: Service Worker and manifest features require serving over `http://localhost` or HTTPS — opening `index.html` directly via `file://` will not register the service worker.

## Project docs

- `PROJECT_STRUCTURE.md` — architecture, folder layout, data/storage/navigation flow, coding rules (read this first).
- `ROADMAP.md` — phase-by-phase build plan and current status.
- `CHANGELOG.md` — history of changes.
