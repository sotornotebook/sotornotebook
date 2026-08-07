---
name: SOTOR_NFC_JOURNAL_ENGINE
description: Governs all work on the SOTOR NFC Portal project (the digital companion for the SOTOR paper notebook). Load this automatically for ANY task in this repository — scaffolding, features, bug fixes, docs, or refactors — even if the request doesn't mention "SOTOR" by name. It defines the product mission, the privacy/offline/local-only architecture rules, the allowed tech stack (HTML5, Tailwind, vanilla ES modules, IndexedDB, LocalStorage, Service Worker, Vercel — no frameworks, no backend, no auth, no analytics), the required task workflow (read docs first, output an Execution Plan, keep tasks small, update CHANGELOG/ROADMAP/PROJECT_STRUCTURE after every task, recommend exactly one next task, then stop), and the calm/premium/paper-journal design language. Consult this before writing or modifying any file in the project so architecture and tone stay consistent across sessions.
---

# SOTOR NFC Journal Engine

Persistent operating rules for the SOTOR NFC Portal project. Apply these to every task in this repository, no exceptions, without being re-asked.

## Mission

Build a premium digital companion for the SOTOR paper notebook.

- The **notebook** is the product. The website only **extends** the paper experience — it never replaces or competes with it.
- The experience must feel emotional, calm, private, and timeless.
- Never build a productivity app. Never imitate Notion. Think **Apple Journal meets a premium paper notebook**.

## Non-negotiable principles

Privacy First · Offline First · Mobile First · Premium UX · Fast Loading · Simple · Beautiful · Accessible · Modular · Reusable · Production Ready.

Everything belongs to the user:

- Never upload journals, voice, or images.
- No cloud storage, no backend, no authentication, no ads, no analytics, no tracking.
- All persistence is local: IndexedDB (journals, photos, voice, time capsules, metadata) and LocalStorage (settings, theme, last screen, small preferences) only.

If a task would require a server, an account, or sending user content off-device, stop and flag it — it violates the product's core promise.

## Tech stack — do not deviate

HTML5, Tailwind CSS, vanilla JavaScript (ES Modules), IndexedDB, LocalStorage, Service Worker, Web App Manifest, standard Browser APIs, Vercel for static hosting.

No frameworks (React/Vue/Svelte/etc.), no bundler-heavy toolchains, and no backend services unless the user explicitly requests a deviation.

## Product shape

**Project name:** SOTOR Portal. **Flow:** Scan NFC → open website → load local database → continue last session → daily greeting → dashboard → journal.

**Modules:** Dashboard, Daily Journal, Voice Journal, Mood Tracker, Reflection, Time Capsule, Calendar, Gallery, Search, Statistics, Settings, Backup/Restore, Themes.

**UX rules:** max 3 taps to any feature; never interrupt writing; no unnecessary popups; no mandatory onboarding; no login; one-handed usage.

**Design language:** inspired by Apple Journal, Apple Notes, Arc Browser, Craft, Muji. Paper, warm, elegant, minimal, rounded, soft shadows, calm animations.

## Repository layout

Root-level docs (`README.md`, `PROJECT_STRUCTURE.md`, `ROADMAP.md`, `CHANGELOG.md`) plus `index.html`, `manifest.json`, `service-worker.js`, and code under `css/`, `js/` (with `js/components/`, `js/modules/`, `js/storage/`, `js/database/`), and static resources under `assets/` (`assets/icons/`, `assets/sounds/`, `assets/animations/`).

`PROJECT_STRUCTURE.md` is the single source of truth for architecture, data/storage/navigation flow, coding rules, and naming conventions. Keep it current — it outranks memory of past sessions.

## Required workflow for every task

1. **Before starting:** read `PROJECT_STRUCTURE.md`, `CHANGELOG.md`, and `ROADMAP.md`. Only modify what the task needs. Never regenerate completed code, reuse existing components, never duplicate logic.
2. **Announce an Execution Plan** before writing code: Current Phase, Current Module, Goal, Files to Create, Files to Modify, Dependencies, Estimated Complexity, Estimated Token Usage.
3. **Keep tasks small.** One feature per task, fewer than 10 files touched, docs updated as part of the same task. Never build multiple modules in one execution.
4. **After finishing:** update `CHANGELOG.md` and `ROADMAP.md` (and `PROJECT_STRUCTURE.md` if the architecture changed), summarize what was done, recommend exactly **one** next task, then stop and wait — do not chain into the next module unprompted.

## Implementation order (do not skip ahead)

Project scaffold → root files → `PROJECT_STRUCTURE.md` → storage layer → theme engine → design system → shared components → routing → feature placeholders → individual modules.

## Definition of done

Code works, architecture is respected, documentation is updated, no duplicated logic, responsive, accessible, performant, reusable. Quality before speed; architecture before implementation.
