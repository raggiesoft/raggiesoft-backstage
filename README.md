# RaggieSoft Backstage (`https://backstage.raggiesoft.com`)

**RaggieSoft Backstage** is the official in-universe bonus features, behind-the-scenes dossiers, and background character correspondence Progressive Web App (PWA) for the RaggieSoft ecosystem.

## Tech Stack
* **UI Component System:** **Web Awesome Pro** (`bb765cf132c5414e`) + **Font Awesome Pro+** (`ec060982d4`)
* **Architecture:** 100% Zero-Database Markdown-Driven Static Site Generation (`scripts/build.mjs`) compiling source Markdown from `/raggiesoft-narratives/backstage/` into static HTML routes and CORS JSON API payloads (`/api/v1/*.json`) consumed by `books.raggiesoft.com`'s `<dialog>` modal viewer.
* **Accessibility & PWA:** Strict WCAG 2.1 AA / Section 508 compliance, native `@media (prefers-color-scheme: dark | light)` + `wa-dark` synchronization, offline Service Worker (`sw.js`), and Web App Manifest (`manifest.json`).

## Licensing
* **Source Code:** MIT License
* **Creative & Narrative Content:** CC BY-SA 4.0
