# RaggieSoft Backstage (`https://backstage.raggiesoft.com`)

**RaggieSoft Backstage** is a standards-based Web Components Progressive Web App (PWA) and static CORS JSON API serving behind-the-scenes production dossiers and supplemental narrative archives across the RaggieSoft ecosystem.

## Tech Stack
* **UI Component System:** **Web Awesome Pro `3.13.0`** (custom elements `<wa-data-grid>`, `<wa-bar-chart>`, `<wa-doughnut-chart>`, `<wa-sparkline>`, `<wa-tree>`, `<wa-drawer>`, `<wa-dialog>`, `<wa-accordion>`, `<wa-tab-group>`, `<wa-dropdown>`, `<wa-popover>`, `<wa-qr-code>`, `<wa-scroller>`, `<wa-card>`, `<wa-callout>`, `<wa-breadcrumb>`, `<wa-copy-button>`, `<wa-input>`) + **Font Awesome Pro+** SVG iconography.
* **Architecture:** 100% Zero-Database Markdown-Driven Static Site Generation (`scripts/build.mjs`) compiling source Markdown into static HTML routes and versioned CORS JSON API payloads (`/api/v1/*.json`) consumed by `books.raggiesoft.com` and companion C#/.NET 10 WPF & SwiftUI apps.
* **Accessibility & PWA:** Code-level WCAG 2.1 AA & Section 508 web compliance, `<meta name="color-scheme">` + `light-dark()` + `wa-dark` theme synchronization, `forced-colors` High Contrast support, offline Service Worker (`sw.js`), and Web App Manifest (`manifest.json`).

## Licensing
* **Source Code:** MIT License
* **Creative & Narrative Content:** CC BY-SA 4.0
