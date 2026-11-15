# RaggieSoft Backstage (`https://backstage.raggiesoft.com`)

**RaggieSoft Backstage** is the official in-universe bonus features, behind-the-scenes dossiers, and background character correspondence Progressive Web App (PWA) for the RaggieSoft ecosystem.

## Tech Stack
* **UI Component System:** **Web Awesome Pro `3.13.0`** (`bb765cf132c5414e` — stackable Pro themes `default`, `awesome`, `glossy`, `mellow`, `premium`; Pro color palettes `default`, `elegant`, `natural`, `vogue`; `<wa-data-grid>`, `<wa-bar-chart>`, `<wa-doughnut-chart>`, `<wa-sparkline>`, `<wa-tree>`, `<wa-drawer>`, `<wa-dialog>`, `<wa-accordion>`, `<wa-tab-group>`, `<wa-dropdown>`, `<wa-popover>`, `<wa-qr-code>`, `<wa-scroller>`, `<wa-card>`, `<wa-callout>`, `<wa-breadcrumb>`, `<wa-copy-button>`, `<wa-input>`) + **Font Awesome Pro+** (`ec060982d4` — `duotone`, `sharp-duotone`, `solid`, and `regular` SVG iconography).
* **Architecture:** 100% Zero-Database Markdown-Driven Static Site Generation (`scripts/build.mjs`) compiling source Markdown from `/raggiesoft-narratives/backstage/` into static HTML routes and CORS JSON API payloads (`/api/v1/*.json`) consumed by `books.raggiesoft.com`.
* **Accessibility & PWA:** Strict WCAG 2.1 AA / Section 508 compliance, `<meta name="color-scheme">` + `light-dark()` + `wa-dark` synchronization, `forced-colors` High Contrast support, offline Service Worker (`sw.js`), and Web App Manifest (`manifest.json`).

## Licensing
* **Source Code:** MIT License
* **Creative & Narrative Content:** CC BY-SA 4.0
