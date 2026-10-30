/**
 * @license MIT
 * ============================================================================
 * scripts/build.mjs — RaggieSoft Backstage (backstage.raggiesoft.com)
 * ============================================================================
 * Architectural Overview:
 * Zero-Database Markdown-Driven Static Site Generation (SSG) compiler and
 * CORS JSON API generator for `https://backstage.raggiesoft.com/`.
 *
 * Tech Stack (Distinct Tech Stack Per Property Rule):
 * - Web Awesome Pro (`bb765cf132c5414e` — `<wa-card>`, `<wa-badge>`,
 *   `<wa-callout>`, `<wa-button>`, `<wa-dialog>`, `wa-dark` theme engine)
 * - Font Awesome Pro+ (`ec060982d4` — `data-fa-kit-code="ec060982d4"`)
 * - Immersive Progressive Web App (PWA) with `manifest.json` and offline-first
 *   Service Worker (`sw.js`).
 * - Cross-Origin `<dialog>` JSON API (`/api/v1/index.json` &
 *   `/api/v1/<slug>.json`) consumed by `books.raggiesoft.com` (`oliver.php` &
 *   `reader.js`) so readers can preview extracted background-character emails
 *   and dossiers inside a native HTML `<dialog>` modal and bounce directly over
 *   to `https://backstage.raggiesoft.com/`.
 *
 * Content Source & Droplet Resilience:
 * - Reads Markdown files from `/raggiesoft-narratives/backstage/` when
 *   building in the local workspace and persists a committed snapshot at
 *   `src/data/backstage-snapshot.json` so builds on the DigitalOcean Droplet
 *   succeed even without `/raggiesoft-narratives` mounted locally.
 * - Mirrors the compiled `/api/v1/<slug>.json` payloads into
 *   `/raggiesoft-assets/raggiesoft-backstage/api/v1/` so `books.raggiesoft.com`
 *   has an instant CDN fallback alongside `https://backstage.raggiesoft.com/api/v1/`.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const snapshotPath = path.join(projectRoot, 'src', 'data', 'backstage-snapshot.json');

/**
 * Escapes HTML special characters for safe interpolation in attributes/text.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Writes a static file to `./dist`, creating parent directories automatically.
 * @param {string} relPath
 * @param {string} content
 */
function writeDistFile(relPath, content) {
  const fullPath = path.join(distDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
}

/**
 * Parses YAML frontmatter from the top of a Markdown string.
 * @param {string} rawMd
 * @returns {{ frontmatter: Record<string, any>, body: string }}
 */
function parseFrontmatter(rawMd) {
  const normalized = rawMd.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*\n+/);
  if (!match) {
    return { frontmatter: {}, body: normalized };
  }
  const fmText = match[1];
  const body = normalized.slice(match[0].length);
  const frontmatter = {};
  let currentArrayKey = null;

  for (const line of fmText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('- ') && currentArrayKey) {
      let val = trimmed.slice(2).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      frontmatter[currentArrayKey].push(val);
    } else {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const key = trimmed.slice(0, colonIdx).trim();
        let val = trimmed.slice(colonIdx + 1).trim();
        if (val === '') {
          currentArrayKey = key;
          frontmatter[key] = [];
        } else {
          if (val.startsWith('"') && val.endsWith('"')) {
            try {
              val = JSON.parse(val);
            } catch {
              val = val.slice(1, -1);
            }
          } else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.slice(1, -1);
          }
          frontmatter[key] = val;
          currentArrayKey = null;
        }
      }
    }
  }
  return { frontmatter, body };
}

/**
 * Formats inline Markdown syntax (`**bold**`, `*italic*`, `` `code` ``,
 * `[text](url)`, `<aac>`, `<pa>`, `<led>`, `<br>`) into semantic HTML.
 * @param {string} text
 * @returns {string}
 */
function renderInlineMarkdown(text) {
  // Preserve explicit <br>, <aac>, <pa>, <led> tags via placeholders before escaping
  const tokens = [];
  const stash = (html) => {
    const id = `\u0000TOK${tokens.length}\u0000`;
    tokens.push(html);
    return id;
  };

  let working = String(text ?? '');

  // Handle <br> / <br/>
  working = working.replace(/<br\s*\/?>/gi, () => stash('<br />'));

  // Handle custom in-universe semantic tags (<aac>, <pa>, <led>)
  working = working.replace(/<aac>([\s\S]*?)<\/aac>/gi, (_, inner) =>
    stash(`<span class="bs-aac-chip" role="note" aria-label="AAC Synthesized Speech"><i class="fa-solid fa-tablet-screen-button" aria-hidden="true"></i> ${escapeHtml(inner)}</span>`)
  );
  working = working.replace(/<pa>([\s\S]*?)<\/pa>/gi, (_, inner) =>
    stash(`<span class="bs-pa-chip"><i class="fa-solid fa-walkie-talkie" aria-hidden="true"></i> ${escapeHtml(inner)}</span>`)
  );
  working = working.replace(/<led>([\s\S]*?)<\/led>/gi, (_, inner) =>
    stash(`<span class="bs-led-sign">${escapeHtml(inner)}</span>`)
  );

  // Handle inline code `...`
  working = working.replace(/`([^`]+)`/g, (_, code) =>
    stash(`<code class="bs-inline-code">${escapeHtml(code)}</code>`)
  );

  // Handle Markdown links [label](href)
  working = working.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const cleanHref = href.trim();
    const isExternal = /^https?:\/\//i.test(cleanHref) && !cleanHref.includes('backstage.raggiesoft.com');
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return stash(
      `<a href="${escapeHtml(cleanHref)}" class="bs-link"${targetAttr}>${renderInlineMarkdown(label)}</a>`
    );
  });

  // Escape remaining raw characters
  working = escapeHtml(working);

  // Bold + Italic (***text***)
  working = working.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold (**text**)
  working = working.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic (*text* or _text_)
  working = working.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Escaped underscores \_
  working = working.replace(/\\_/g, '_');
  // Escaped dollars \$
  working = working.replace(/\\\$/g, '$');

  // Restore stashed HTML tokens
  working = working.replace(/\u0000TOK(\d+)\u0000/g, (_, idx) => tokens[Number(idx)] ?? '');

  return working;
}

/**
 * Converts a full Backstage Markdown body into semantic HTML with specialized
 * styling for in-universe CPI administrative emails (`> **To:**`, `> **From:**`)
 * and EHS Fire Drill logs.
 * @param {string} md
 * @returns {string}
 */
function renderMarkdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const htmlBlocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code blocks
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      htmlBlocks.push(
        `<pre class="bs-code-block" data-lang="${escapeHtml(lang || 'text')}"><code>${escapeHtml(
          codeLines.join('\n')
        )}</code></pre>`
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      htmlBlocks.push('<hr class="bs-divider" />');
      i++;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length + 1, 4); // Shift # -> h2 inside article
      const text = headingMatch[2];
      htmlBlocks.push(`<h${level} class="bs-heading bs-h${level}">${renderInlineMarkdown(text)}</h${level}>`);
      i++;
      continue;
    }

    // Blockquotes (including in-universe CPI email threads & EHS reports)
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const joinedQuote = quoteLines.join('\n');
      const isEmailHeader =
        /\*\*(To|From|Date|Subject|Reference|Reference No\.):\*\*/i.test(joinedQuote);
      const isEhsReport = /ENVIRONMENTAL HEALTH & SAFETY|OFFICIAL JOINT ADMINISTRATIVE COMPLAINT|OFFICIAL GOOD-FAITH REMEDIATION/i.test(
        joinedQuote
      );
      const innerHtml = renderMarkdownToHtml(joinedQuote);

      if (isEmailHeader || isEhsReport) {
        const badgeLabel = isEhsReport
          ? 'Official Institutional Filing / EHS Record'
          : 'Encrypted CPI Administrative Mail Dispatch';
        const iconClass = isEhsReport ? 'fa-solid fa-file-shield' : 'fa-solid fa-envelope-open-text';
        htmlBlocks.push(`
          <section class="bs-email-card" aria-label="${escapeHtml(badgeLabel)}">
            <div class="bs-email-card-bar">
              <span class="bs-email-card-badge">
                <i class="${iconClass}" aria-hidden="true"></i> ${escapeHtml(badgeLabel)}
              </span>
              <span class="bs-email-card-seal">VERIFIED ARCHIVE</span>
            </div>
            <div class="bs-email-card-body">
              ${innerHtml}
            </div>
          </section>
        `);
      } else {
        htmlBlocks.push(`<blockquote class="bs-blockquote">${innerHtml}</blockquote>`);
      }
      continue;
    }

    // Unordered or Ordered Lists
    if (/^(\*|-|\d+\.)\s+/.test(trimmed)) {
      const isOrdered = /^\d+\.\s+/.test(trimmed);
      const tag = isOrdered ? 'ol' : 'ul';
      const items = [];

      while (i < lines.length) {
        const cur = lines[i];
        const curTrim = cur.trim();
        if (!curTrim) break;
        const itemMatch = curTrim.match(isOrdered ? /^\d+\.\s+(.+)$/ : /^(\*|-)\s+(.+)$/);
        if (itemMatch) {
          const itemText = isOrdered ? itemMatch[1] : itemMatch[2];
          items.push([itemText]);
          i++;
        } else if (items.length > 0 && (/^\s{2,}/.test(cur) || /^(\*|-)\s+/.test(curTrim))) {
          items[items.length - 1].push(curTrim.replace(/^(\*|-)\s+/, '• '));
          i++;
        } else {
          break;
        }
      }

      const lis = items
        .map((linesArr) => {
          const first = renderInlineMarkdown(linesArr[0]);
          const rest = linesArr
            .slice(1)
            .map((l) => `<div class="bs-list-subline">${renderInlineMarkdown(l)}</div>`)
            .join('');
          return `<li>${first}${rest}</li>`;
        })
        .join('\n');
      htmlBlocks.push(`<${tag} class="bs-list">${lis}</${tag}>`);
      continue;
    }

    // Paragraph block
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('```') &&
      !/^(-{3,}|\*{3,})$/.test(lines[i].trim()) &&
      !/^(\*|-|\d+\.)\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    htmlBlocks.push(`<p>${renderInlineMarkdown(paraLines.join(' '))}</p>`);
  }

  return htmlBlocks.join('\n');
}

/**
 * Recursively collects all `.md` files under a directory.
 * @param {string} dir
 * @param {string} baseDir
 * @returns {string[]}
 */
function walkMarkdownFiles(dir, baseDir = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(full, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return results.sort();
}

/**
 * Loads all Backstage Markdown items from `/raggiesoft-narratives/backstage`
 * (or falls back to `src/data/backstage-snapshot.json` on the Droplet).
 */
function loadBackstageItems() {
  const candidates = [
    path.resolve(projectRoot, '../../../raggiesoft-narratives/backstage'),
    path.resolve(projectRoot, '../../raggiesoft-narratives/backstage'),
    path.resolve(projectRoot, '../raggiesoft-narratives/backstage')
  ];

  let narrativesDir = null;
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
      narrativesDir = c;
      break;
    }
  }

  if (narrativesDir) {
    const relFiles = walkMarkdownFiles(narrativesDir);
    const items = relFiles.map((relFile) => {
      const raw = fs.readFileSync(path.join(narrativesDir, relFile), 'utf-8');
      const { frontmatter, body } = parseFrontmatter(raw);
      // Compute clean route slug: e.g. `books/aubrie/index.md` -> `books/aubrie`
      let slug = relFile.replace(/\.md$/, '');
      if (slug.endsWith('/index')) {
        slug = slug.slice(0, -'/index'.length);
      }
      const routePath = `/${slug}`;
      const html = renderMarkdownToHtml(body);

      return {
        slug,
        routePath,
        canonicalUrl: `https://backstage.raggiesoft.com${routePath}`,
        apiUrl: `https://backstage.raggiesoft.com/api/v1/${slug}.json`,
        title: frontmatter.title || slug,
        subtitle: frontmatter.subtitle || '',
        category: frontmatter.category || 'Backstage Dossier',
        property: frontmatter.property || 'general',
        date: frontmatter.date || '',
        time: frontmatter.time || '',
        location: frontmatter.location || '',
        sender: frontmatter.sender || '',
        recipient: frontmatter.recipient || '',
        subject: frontmatter.subject || '',
        relatedBookUrl: frontmatter.relatedBookUrl || '',
        relatedBookLabel: frontmatter.relatedBookLabel || 'Return to RaggieSoft Book Reader',
        summary: frontmatter.summary || frontmatter.subtitle || frontmatter.title || '',
        markdown: body,
        html
      };
    });

    fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
    fs.writeFileSync(snapshotPath, JSON.stringify(items, null, 2), 'utf-8');
    return items;
  }

  if (fs.existsSync(snapshotPath)) {
    return JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  }

  throw new Error('Could not locate raggiesoft-narratives/backstage or backstage-snapshot.json');
}

/**
 * Generates the Web Awesome Pro + Font Awesome Pro+ adaptive stylesheet
 * (`/assets/backstage.css`) enforcing WCAG 2.1 AA contrast in both Light Mode
 * and Dark Mode.
 * @returns {string}
 */
function buildBackstageCss() {
  return `/**
 * @license MIT
 * ============================================================================
 * /assets/backstage.css — RaggieSoft Backstage (backstage.raggiesoft.com)
 * ============================================================================
 * Adaptive Web Awesome Pro + Font Awesome Pro+ styling with strict WCAG 2.1 AA
 * contrast ratios (>= 4.5:1 normal text, >= 3.0:1 UI components) across both
 * Light Mode and Dark Mode.
 * ============================================================================
 */

:root {
  color-scheme: light dark;
  --bs-bg: #f8fafc;
  --bs-surface: #ffffff;
  --bs-elevated: #f1f5f9;
  --bs-text: #0f172a;
  --bs-muted: #334155;
  --bs-border: #cbd5e1;
  --bs-primary: #861f41;
  --bs-primary-fg: #ffffff;
  --bs-accent: #b45309;
  --bs-link: #7c1d3c;
  --bs-email-bg: #fffdf9;
  --bs-email-bar: #f1f5f9;
  --bs-email-border: #94a3b8;
  --bs-aac-bg: #eff6ff;
  --bs-aac-fg: #1e3a8a;
  --bs-aac-border: #93c5fd;
  --bs-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bs-bg: #070b14;
    --bs-surface: #0f172a;
    --bs-elevated: #1e293b;
    --bs-text: #f8fafc;
    --bs-muted: #cbd5e1;
    --bs-border: #334155;
    --bs-primary: #f59e0b;
    --bs-primary-fg: #0f172a;
    --bs-accent: #38bdf8;
    --bs-link: #7dd3fc;
    --bs-email-bg: #0b1324;
    --bs-email-bar: #16223b;
    --bs-email-border: #475569;
    --bs-aac-bg: rgba(56, 189, 248, 0.14);
    --bs-aac-fg: #bae6fd;
    --bs-aac-border: rgba(56, 189, 248, 0.45);
    --bs-shadow: 0 12px 34px rgba(0, 0, 0, 0.45);
  }
}

html[data-theme="dark"] {
  --bs-bg: #070b14;
  --bs-surface: #0f172a;
  --bs-elevated: #1e293b;
  --bs-text: #f8fafc;
  --bs-muted: #cbd5e1;
  --bs-border: #334155;
  --bs-primary: #f59e0b;
  --bs-primary-fg: #0f172a;
  --bs-accent: #38bdf8;
  --bs-link: #7dd3fc;
  --bs-email-bg: #0b1324;
  --bs-email-bar: #16223b;
  --bs-email-border: #475569;
  --bs-aac-bg: rgba(56, 189, 248, 0.14);
  --bs-aac-fg: #bae6fd;
  --bs-aac-border: rgba(56, 189, 248, 0.45);
  --bs-shadow: 0 12px 34px rgba(0, 0, 0, 0.45);
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: var(--bs-bg);
  color: var(--bs-text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.7;
  display: flex;
  flex-direction: column;
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 1rem;
  z-index: 9999;
  padding: 0.65rem 1.15rem;
  background: var(--bs-primary);
  color: var(--bs-primary-fg);
  font-weight: 800;
  border-radius: 0.5rem;
  text-decoration: none;
}
.skip-link:focus {
  top: 1rem;
}

:focus-visible {
  outline: 3px solid var(--bs-accent);
  outline-offset: 2px;
}

.bs-container {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.bs-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bs-surface);
  border-bottom: 1px solid var(--bs-border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.bs-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  flex-wrap: wrap;
}

.bs-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 900;
  font-size: 1.08rem;
  letter-spacing: 0.03em;
  color: var(--bs-text);
  text-decoration: none;
}

.bs-brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  background: var(--bs-primary);
  color: var(--bs-primary-fg);
}

.bs-nav {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
}

.bs-nav-link, .bs-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--bs-text);
  background: var(--bs-elevated);
  border: 1px solid var(--bs-border);
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.bs-nav-link:hover, .bs-btn:hover {
  border-color: var(--bs-primary);
}

.bs-nav-link[aria-current="page"], .bs-btn-primary {
  background: var(--bs-primary);
  color: var(--bs-primary-fg);
  border-color: var(--bs-primary);
}

.bs-hero {
  margin: 2rem 0 1.75rem;
  padding: 2rem;
  border-radius: 1rem;
  background: var(--bs-surface);
  border: 1px solid var(--bs-border);
  box-shadow: var(--bs-shadow);
}

.bs-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: var(--bs-elevated);
  color: var(--bs-text);
  border: 1px solid var(--bs-border);
  margin-bottom: 0.75rem;
}

.bs-title {
  margin: 0 0 0.45rem;
  font-size: clamp(1.65rem, 3vw, 2.35rem);
  line-height: 1.2;
}

.bs-subtitle {
  margin: 0 0 1rem;
  font-size: 1.12rem;
  color: var(--bs-muted);
}

.bs-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--bs-border);
  font-size: 0.9rem;
}

.bs-meta-item {
  background: var(--bs-elevated);
  padding: 0.6rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid var(--bs-border);
}

.bs-meta-label {
  display: block;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bs-muted);
}

.bs-article-card {
  display: block;
  background: var(--bs-surface);
  border: 1px solid var(--bs-border);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--bs-shadow);
}

.bs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
  margin: 1.25rem 0 2.5rem;
}

.bs-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--bs-surface);
  border: 1px solid var(--bs-border);
  border-radius: 0.85rem;
  padding: 1.35rem;
  box-shadow: var(--bs-shadow);
}

.bs-card h3 {
  margin: 0.4rem 0;
  font-size: 1.18rem;
}

.bs-card p {
  margin: 0 0 1rem;
  color: var(--bs-muted);
  font-size: 0.95rem;
}

.bs-email-card {
  margin: 1.5rem 0;
  border: 1px solid var(--bs-email-border);
  border-left: 5px solid var(--bs-primary);
  border-radius: 0.75rem;
  background: var(--bs-email-bg);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.bs-email-card-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 1.1rem;
  background: var(--bs-email-bar);
  border-bottom: 1px solid var(--bs-email-border);
  font-size: 0.8rem;
  font-weight: 800;
}

.bs-email-card-seal {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: var(--bs-primary);
  color: var(--bs-primary-fg);
}

.bs-email-card-body {
  padding: 1.15rem 1.35rem;
}

.bs-email-card-body p:first-child {
  margin-top: 0;
}
.bs-email-card-body p:last-child {
  margin-bottom: 0;
}

.bs-blockquote {
  margin: 1.25rem 0;
  padding: 0.85rem 1.25rem;
  border-left: 4px solid var(--bs-primary);
  background: var(--bs-elevated);
  border-radius: 0 0.5rem 0.5rem 0;
}

.bs-aac-chip {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 0.38rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.92em;
  font-weight: 700;
  background: var(--bs-aac-bg);
  color: var(--bs-aac-fg);
  border: 1px solid var(--bs-aac-border);
}

.bs-pa-chip {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 0.38rem;
  font-weight: 700;
  background: var(--bs-elevated);
  border: 1px solid var(--bs-border);
}

.bs-led-sign {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.35rem;
  background: #090d16;
  color: #fbbf24;
  border: 1px solid #f59e0b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.bs-inline-code {
  padding: 0.12rem 0.4rem;
  border-radius: 0.3rem;
  background: var(--bs-elevated);
  border: 1px solid var(--bs-border);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.bs-link {
  color: var(--bs-link);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.bs-divider {
  border: none;
  border-top: 1px solid var(--bs-border);
  margin: 2rem 0;
}

.bs-footer {
  margin-top: auto;
  padding: 2.25rem 0;
  background: var(--bs-surface);
  border-top: 1px solid var(--bs-border);
  font-size: 0.9rem;
}

.bs-disclaimer {
  padding: 1.1rem 1.25rem;
  border-radius: 0.75rem;
  background: var(--bs-elevated);
  border: 1px solid var(--bs-border);
  margin-bottom: 1rem;
  color: var(--bs-muted);
}
`;
}

/**
 * Generates `/assets/backstage-client.js` handling:
 * 1. Dark/Light theme toggle synchronized with `<meta name="color-scheme">` and
 *    Web Awesome's `.wa-dark` class on `<html>`.
 * 2. Instant search filtering across the Backstage correspondence and dossiers.
 * 3. In-page `<dialog>` quick-preview modal (`#bs-quick-preview-dialog`).
 * 4. Service Worker registration (`/sw.js`) for offline PWA capability.
 * @returns {string}
 */
function buildBackstageClientJs() {
  return `/**
 * @license MIT
 * /assets/backstage-client.js — Client Progressive Enhancement & PWA Controller
 */
(function () {
  var meta = document.querySelector('meta[name="color-scheme"]');
  var toggleBtn = document.getElementById('theme-toggle');
  var toggleLabel = document.getElementById('theme-toggle-label');

  function getSystemScheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function getActiveScheme() {
    try {
      var s = localStorage.getItem('color-scheme');
      if (s === 'light' || s === 'dark') return s;
    } catch (e) {}
    return getSystemScheme();
  }

  function applyScheme() {
    var current = getActiveScheme();
    document.documentElement.setAttribute('data-theme', current);
    document.documentElement.classList.toggle('wa-dark', current === 'dark');
    if (toggleLabel) {
      var pinned = null;
      try { pinned = localStorage.getItem('color-scheme'); } catch (e) {}
      toggleLabel.textContent = current === 'dark'
        ? (pinned ? 'Dark Mode' : 'Dark (Auto)')
        : (pinned ? 'Light Mode' : 'Light (Auto)');
    }
  }

  if (toggleBtn && meta) {
    applyScheme();
    toggleBtn.addEventListener('click', function () {
      var current = getActiveScheme();
      var next = current === 'dark' ? 'light' : 'dark';
      var sys = getSystemScheme();
      try {
        if (next === sys) {
          localStorage.removeItem('color-scheme');
          meta.content = 'light dark';
        } else {
          localStorage.setItem('color-scheme', next);
          meta.content = next;
        }
      } catch (e) {
        meta.content = next;
      }
      applyScheme();
    });
  }

  // Instant filter on index pages
  var searchInput = document.getElementById('backstage-search');
  if (searchInput) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-bs-card]'));
    searchInput.addEventListener('input', function () {
      var q = (searchInput.value || '').toLowerCase().trim();
      cards.forEach(function (card) {
        var hay = (card.getAttribute('data-bs-search') || '').toLowerCase();
        card.style.display = !q || hay.indexOf(q) !== -1 ? '' : 'none';
      });
    });
  }

  // Quick-Preview <dialog> modal on Backstage index cards
  var previewDialog = document.getElementById('bs-preview-dialog');
  var previewTitle = document.getElementById('bs-preview-title');
  var previewMeta = document.getElementById('bs-preview-meta');
  var previewBody = document.getElementById('bs-preview-body');
  var previewFullLink = document.getElementById('bs-preview-full-link');
  var previewClose = document.getElementById('bs-preview-close');

  if (previewDialog && previewClose) {
    previewClose.addEventListener('click', function () {
      previewDialog.close();
    });
    previewDialog.addEventListener('click', function (e) {
      if (e.target === previewDialog) previewDialog.close();
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-bs-preview-slug]');
    if (!btn || !previewDialog) return;
    e.preventDefault();
    var slug = btn.getAttribute('data-bs-preview-slug');
    if (!slug) return;
    previewTitle.textContent = 'Loading Backstage Dossier...';
    previewMeta.textContent = '';
    previewBody.innerHTML = '<p>Fetching archival record...</p>';
    previewFullLink.setAttribute('href', '/' + slug);
    if (typeof previewDialog.showModal === 'function') {
      previewDialog.showModal();
    }
    fetch('/api/v1/' + slug + '.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        previewTitle.textContent = data.title || 'Backstage Dossier';
        var metaParts = [];
        if (data.date) metaParts.push(data.date + (data.time ? ' • ' + data.time : ''));
        if (data.sender) metaParts.push('From: ' + data.sender);
        if (data.subject) metaParts.push('Subject: ' + data.subject);
        previewMeta.textContent = metaParts.join(' | ');
        previewBody.innerHTML = data.html || '';
        previewFullLink.setAttribute('href', '/' + data.slug);
      })
      .catch(function () {
        window.location.href = '/' + slug;
      });
  });

  // Register Offline-Capable PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }
})();
`;
}

/**
 * Generates the Web Awesome Pro + Font Awesome Pro+ outer HTML5 document shell.
 */
function renderBackstageShell({
  title,
  description,
  canonicalPath = '/',
  ogImage = 'https://assets.raggiesoft.com/raggiesoft-corporate/images/og/raggiesoft-corporate-og.jpg',
  bodyHtml
}) {
  const safeTitle = escapeHtml(title.slice(0, 60));
  const safeDesc = escapeHtml(description.slice(0, 155));
  const canonicalUrl = `https://backstage.raggiesoft.com${canonicalPath === '/' ? '' : canonicalPath}`;

  const navItems = [
    { href: '/', label: 'Backstage Hub', icon: 'fa-solid fa-clapperboard-play' },
    { href: '/locations/cpi', label: 'CPI Campus Dossier', icon: 'fa-solid fa-building-columns' },
    { href: '/books/aubrie', label: 'The Eleventh Child (12)', icon: 'fa-solid fa-book-sparkles' },
    { href: '/music/stardust-engine-origins', label: 'Music Backstage', icon: 'fa-solid fa-compact-disc' },
    { href: '/corporations/vectron-question-the-rules', label: 'Vectron Archive', icon: 'fa-solid fa-scale-balanced' }
  ];

  const navHtml = navItems
    .map((item) => {
      const isCurrent =
        item.href === canonicalPath ||
        (item.href !== '/' && canonicalPath.startsWith(item.href + '/'));
      return `<li><a href="${item.href}" class="bs-nav-link"${
        isCurrent ? ' aria-current="page"' : ''
      }><i class="${item.icon}" aria-hidden="true"></i> <span>${escapeHtml(item.label)}</span></a></li>`;
    })
    .join('\n            ');

  return `<!doctype html>
<html lang="en" class="wa-dark" data-theme="dark" data-fa-kit-code="ec060982d4">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#861f41" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="https://assets.raggiesoft.com/raggiesoft-corporate/images/logos/raggiesoft-logo.png" />
    <script>
      try {
        var storedScheme = localStorage.getItem('color-scheme');
        document.querySelector('meta[name="color-scheme"]').content = storedScheme ?? 'light dark';
        var resolved = (storedScheme === 'light' || storedScheme === 'dark')
          ? storedScheme
          : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.setAttribute('data-theme', resolved);
        document.documentElement.classList.toggle('wa-dark', resolved === 'dark');
      } catch (e) {}
    </script>
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="RaggieSoft Backstage" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://raggiesoft.com/#organization',
          name: 'RaggieSoft',
          url: 'https://raggiesoft.com'
        },
        {
          '@type': 'WebSite',
          '@id': 'https://backstage.raggiesoft.com/#website',
          url: 'https://backstage.raggiesoft.com',
          name: 'RaggieSoft Backstage — Narrative Production & Dossier Archive',
          publisher: { '@id': 'https://raggiesoft.com/#organization' }
        },
        {
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: title,
          description: description,
          isPartOf: { '@id': 'https://backstage.raggiesoft.com/#website' },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: ogImage
          },
          license: 'https://creativecommons.org/licenses/by-sa/4.0/'
        }
      ]
    })}</script>
    <link rel="icon" type="image/png" href="https://assets.raggiesoft.com/raggiesoft-corporate/images/logos/raggiesoft-logo.png" />

    <!-- Reactivated Web Awesome Pro (bb765cf132c5414e) & Font Awesome Pro+ (ec060982d4) -->
    <link rel="stylesheet" href="https://ka-p.webawesome.com/kit/bb765cf132c5414e/webawesome@3.10.0/styles/themes/default.css" />
    <link rel="stylesheet" href="https://ka-p.webawesome.com/kit/bb765cf132c5414e/webawesome@3.10.0/styles/themes/dark.css" />
    <link rel="stylesheet" href="https://ka-p.webawesome.com/kit/bb765cf132c5414e/webawesome@3.10.0/styles/utilities.css" />
    <link rel="stylesheet" href="https://ka-p.webawesome.com/kit/bb765cf132c5414e/webawesome@3.10.0/styles/native.css" />
    <script type="module" src="https://ka-p.webawesome.com/kit/bb765cf132c5414e/webawesome@3.10.0/webawesome.loader.js"></script>
    <link rel="stylesheet" href="https://kit.fontawesome.com/ec060982d4.css" crossorigin="anonymous" />

    <link rel="stylesheet" href="/assets/backstage.css?v=20261024a" />
    <link rel="stylesheet" href="https://assets.raggiesoft.com/common/css/raggiesoft-network.css?v=20261029f" />

    <!-- Google Analytics 4 (GA4) Telemetry Integration (G-P9RG9JVYB6) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-P9RG9JVYB6"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-P9RG9JVYB6');
    </script>
  </head>
  <body>
    <a href="#content" class="skip-link">Skip to Backstage main content</a>

    <nav class="rs-network-bar" aria-label="RaggieSoft Ecosystem Network">
      <div class="rs-network-bar-inner">
        <span class="rs-network-label">✦ RaggieSoft Network:</span>
        <ul class="rs-network-links">
          <li><a href="https://raggiesoft.com">🌐 Hub</a></li>
          <li><a href="https://nebulae.raggiesoft.com">🌌 Nebulae</a></li>
          <li><a href="https://books.raggiesoft.com">📚 Books</a></li>
          <li><a href="https://backstage.raggiesoft.com" aria-current="page" class="is-active">🎬 Backstage</a></li>
          <li><a href="https://music.raggiesoft.com">🎧 Music</a></li>
          <li><a href="https://stardust.raggiesoft.com">🚀 Stardust</a></li>
          <li><a href="https://engineroom.raggiesoft.com">⚙️ Engine Room</a></li>
          <li><a href="https://corporate.raggiesoft.com">🏢 Corporate</a></li>
          <li><a href="https://storetrainer.raggiesoft.com">💾 StoreTrainer</a></li>
          <li><a href="https://michaelpragsdale.com">👔 Michael P. Ragsdale</a></li>
        </ul>
      </div>
    </nav>

    <header class="bs-header" role="banner">
      <div class="bs-container bs-header-inner">
        <a href="/" class="bs-brand">
          <i class="fa-solid fa-film" aria-hidden="true"></i>
          <span>RaggieSoft Backstage</span>
          <span class="bs-brand-badge">Web Awesome Pro • PWA</span>
        </a>
        <nav aria-label="RaggieSoft Backstage Primary Navigation">
          <ul class="bs-nav">
            ${navHtml}
            <li>
              <button type="button" id="theme-toggle" class="bs-btn" aria-label="Toggle Light and Dark Mode">
                <i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i>
                <span id="theme-toggle-label">Theme</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main id="content" class="bs-container" tabindex="-1">
      ${bodyHtml}
    </main>

    <dialog id="bs-preview-dialog" aria-labelledby="bs-preview-title" style="padding: 0; border: 1px solid var(--bs-border); border-radius: 14px; background: var(--bs-surface); color: var(--bs-text); max-width: 820px; width: 92%; max-height: 86vh; box-shadow: 0 20px 60px rgba(0,0,0,0.55);">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.35rem; background: var(--bs-elevated); border-bottom: 1px solid var(--bs-border);">
        <div>
          <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--bs-muted);">🎬 RaggieSoft Backstage Quick-View</span>
          <h2 id="bs-preview-title" style="margin: 0.15rem 0 0; font-size: 1.25rem;">Backstage Dossier</h2>
        </div>
        <button type="button" id="bs-preview-close" class="bs-btn" aria-label="Close preview dialog">✕ Close</button>
      </div>
      <div id="bs-preview-meta" style="padding: 0.6rem 1.35rem; font-size: 0.85rem; background: var(--bs-bg); border-bottom: 1px solid var(--bs-border); color: var(--bs-muted);"></div>
      <div id="bs-preview-body" style="padding: 1.35rem; overflow-y: auto; max-height: calc(86vh - 170px);"></div>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding: 0.85rem 1.35rem; background: var(--bs-elevated); border-top: 1px solid var(--bs-border);">
        <span style="font-size: 0.82rem; color: var(--bs-muted);">Served via RaggieSoft Backstage JSON API (<code>/api/v1/</code>)</span>
        <a id="bs-preview-full-link" href="/" class="bs-btn bs-btn-primary">Open Full Dossier Page ↗</a>
      </div>
    </dialog>

    <footer class="bs-footer" role="contentinfo">
      <div class="bs-container">
        <div class="bs-disclaimer" role="note" aria-label="Fictitious Persons and Entities Disclaimer">
          <strong>Fictitious Persons, Universities, Bands &amp; Entities Disclaimer:</strong> All narrative characters, bands (including The Stardust Engine, Fractured Prisms, Crimson Node, The Paper Wall, Mana Canvas, The Arctic Symphony Project, and Teller County), biographies, universities (including <strong>Commonwealth Polytechnic Institute / CPI</strong>, The Forgers, The Crucible, Eleanor Bennett Commonwealth Hall, Callahan Hall, and Kincaid Commons), corporations (including OmniCorp, Vectron Energy Corp., Apex Records, Prairie Coachworks, and Sainte-Claire), transit agencies (Blue Ridge Transit, Radford Transit, and Mountain Valley Transit), in-universe administrative correspondence, legal filings, and any entity with <strong>&ldquo;LLC&rdquo;</strong>, <strong>&ldquo;Trust&rdquo;</strong>, or <strong>&ldquo;Holdings&rdquo;</strong> in its name (including <em>Engine Room Records, LLC</em>, <em>The O'Connell Family, LLC</em>, <em>Artists First Management, LLC</em>, <em>Stardust Properties, LLC</em>, <em>Stardust Blacksburg, LLC</em>, <em>Stardust Strategic Assets, LLC</em>, <em>Pacific Rim Properties, LLC</em>, <em>Jessica Miller Center, LLC</em>, and <em>Aethelgard Holdings, LLC</em>) are <strong>100% works of fiction</strong> inside the RaggieSoft universe. Any resemblance to actual persons (living or dead), universities, businesses, institutions, or events is purely coincidental. In real life, there is only <strong>Engine Room Records</strong> (no &ldquo;LLC&rdquo;), the real-world creative brand under which <strong>Michael P. Ragsdale</strong> distributes his music.
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <p style="margin: 0;">
            &copy; 2026 Michael P. Ragsdale / RaggieSoft. Code licensed under the
            <a href="https://opensource.org/licenses/MIT" class="bs-link" target="_blank" rel="noopener noreferrer">MIT License</a>.
            Creative content licensed under
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" class="bs-link" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.
          </p>
          <a href="/api/v1/index.json" class="bs-link"><i class="fa-solid fa-brackets-curly" aria-hidden="true"></i> Backstage JSON API Index</a>
        </div>
      </div>
    </footer>

    <script src="/assets/backstage-client.js?v=20261024a" defer></script>
    <script src="https://assets.raggiesoft.com/common/js/raggiesoft-network.js?v=20261029f" defer></script>
  </body>
</html>`;
}

/**
 * Renders an individual Backstage article/correspondence page.
 */
function renderItemPage(item, allItems) {
  const metaBlocks = [];
  if (item.date) {
    metaBlocks.push(`
      <div class="bs-meta-item">
        <span class="bs-meta-label"><i class="fa-solid fa-calendar-day" aria-hidden="true"></i> In-Universe Date &amp; Time</span>
        <strong>${escapeHtml(item.date)}${item.time ? ` • ${escapeHtml(item.time)}` : ''}</strong>
      </div>
    `);
  }
  if (item.location) {
    metaBlocks.push(`
      <div class="bs-meta-item">
        <span class="bs-meta-label"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> In-Universe Location</span>
        <strong>${escapeHtml(item.location)}</strong>
      </div>
    `);
  }
  if (item.sender) {
    metaBlocks.push(`
      <div class="bs-meta-item">
        <span class="bs-meta-label"><i class="fa-solid fa-user-pen" aria-hidden="true"></i> From / Author</span>
        <strong>${escapeHtml(item.sender)}</strong>
      </div>
    `);
  }
  if (item.recipient) {
    metaBlocks.push(`
      <div class="bs-meta-item">
        <span class="bs-meta-label"><i class="fa-solid fa-users" aria-hidden="true"></i> To / Recipients</span>
        <strong>${escapeHtml(item.recipient)}</strong>
      </div>
    `);
  }

  const relatedItems = allItems
    .filter((other) => other.slug !== item.slug && other.property === item.property)
    .slice(0, 6);

  const relatedHtml =
    relatedItems.length > 0
      ? `
    <section aria-labelledby="related-backstage-heading" style="margin-bottom: 2.5rem;">
      <h2 id="related-backstage-heading" style="font-size: 1.35rem; margin-bottom: 0.85rem;">
        <i class="fa-solid fa-folder-tree" aria-hidden="true"></i> More in This Backstage Archive
      </h2>
      <div class="bs-grid">
        ${relatedItems
          .map(
            (rel) => `
          <wa-card class="bs-card">
            <div>
              <span class="bs-kicker">${escapeHtml(rel.date || rel.category)}</span>
              <h3><a href="${rel.routePath}" class="bs-link">${escapeHtml(rel.title)}</a></h3>
              <p>${escapeHtml(rel.summary)}</p>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <a href="${rel.routePath}" class="bs-btn bs-btn-primary">Read Dossier</a>
              <button type="button" class="bs-btn" data-bs-preview-slug="${escapeHtml(rel.slug)}">Quick Dialog</button>
            </div>
          </wa-card>
        `
          )
          .join('\n')}
      </div>
    </section>`
      : '';

  const bodyHtml = `
    <nav aria-label="Breadcrumb" style="margin-top: 1.25rem; font-size: 0.9rem;">
      <a href="/" class="bs-link">🎬 RaggieSoft Backstage</a>
      <span aria-hidden="true"> / </span>
      <span>${escapeHtml(item.category)}</span>
      <span aria-hidden="true"> / </span>
      <strong aria-current="page">${escapeHtml(item.title)}</strong>
    </nav>

    <section class="bs-hero" aria-labelledby="dossier-heading">
      <span class="bs-kicker">
        <i class="fa-solid fa-sparkles" aria-hidden="true"></i> ${escapeHtml(item.category)}
      </span>
      <h1 id="dossier-heading" class="bs-title">${escapeHtml(item.title)}</h1>
      ${item.subtitle ? `<p class="bs-subtitle">${escapeHtml(item.subtitle)}</p>` : ''}

      <div style="display: flex; gap: 0.65rem; flex-wrap: wrap; margin-top: 1rem;">
        ${
          item.relatedBookUrl
            ? `<a href="${escapeHtml(item.relatedBookUrl)}" class="bs-btn bs-btn-primary">
                <i class="fa-solid fa-book-open-cover" aria-hidden="true"></i> ${escapeHtml(item.relatedBookLabel)} ↗
              </a>`
            : ''
        }
        <a href="/books/aubrie" class="bs-btn">
          <i class="fa-solid fa-box-archive" aria-hidden="true"></i> All Eleventh Child Bonus Features
        </a>
        <a href="/api/v1/${escapeHtml(item.slug)}.json" class="bs-btn">
          <i class="fa-solid fa-code" aria-hidden="true"></i> View Dialog JSON API
        </a>
      </div>

      ${metaBlocks.length > 0 ? `<div class="bs-meta-grid">${metaBlocks.join('')}</div>` : ''}
    </section>

    <wa-card class="bs-article-card">
      <article aria-label="${escapeHtml(item.title)}">
        ${item.html}
      </article>
    </wa-card>

    ${relatedHtml}
  `;

  return renderBackstageShell({
    title: `${item.title} | RaggieSoft Backstage`,
    description: item.summary,
    canonicalPath: item.routePath,
    bodyHtml
  });
}

/**
 * Renders the master RaggieSoft Backstage homepage (`/index.html`).
 */
function renderHomePage(items) {
  const correspondenceItems = items.filter((i) => i.slug.startsWith('books/aubrie/correspondence/'));
  const featureItems = items.filter((i) => !i.slug.startsWith('books/aubrie/correspondence/'));

  const renderCard = (item) => `
    <wa-card class="bs-card" data-bs-card data-bs-search="${escapeHtml(
      [item.title, item.subtitle, item.category, item.sender, item.recipient, item.subject, item.summary].join(' ')
    )}">
      <div>
        <span class="bs-kicker">${escapeHtml(item.date ? `${item.date} • ${item.category}` : item.category)}</span>
        <h3><a href="${item.routePath}" class="bs-link">${escapeHtml(item.title)}</a></h3>
        ${item.subtitle ? `<div style="font-size: 0.86rem; font-weight: 700; margin-bottom: 0.45rem; color: var(--bs-text);">${escapeHtml(item.subtitle)}</div>` : ''}
        <p>${escapeHtml(item.summary)}</p>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
        <a href="${item.routePath}" class="bs-btn bs-btn-primary">
          <i class="fa-solid fa-folder-open" aria-hidden="true"></i> Open Feature
        </a>
        <button type="button" class="bs-btn" data-bs-preview-slug="${escapeHtml(item.slug)}">
          <i class="fa-solid fa-window-restore" aria-hidden="true"></i> Preview &lt;dialog&gt;
        </button>
      </div>
    </wa-card>
  `;

  const bodyHtml = `
    <section class="bs-hero" aria-labelledby="backstage-hero-title">
      <span class="bs-kicker">
        <i class="fa-solid fa-stars" aria-hidden="true"></i> Web Awesome Pro • Font Awesome Pro+ • Immersive PWA
      </span>
      <h1 id="backstage-hero-title" class="bs-title">
        🎬 RaggieSoft Backstage: Behind the Scenes &amp; In-Universe Bonus Features
      </h1>
      <p class="bs-subtitle">
        The official 100% in-universe companion portal for every RaggieSoft property—housing the architectural dossier of <strong>Commonwealth Polytechnic Institute (CPI)</strong>, alternate-POV notes, and extracted background-character correspondence connected directly to <strong>RaggieSoft Book Reader (<code>books.raggiesoft.com</code>)</strong> via our cross-origin <code>&lt;dialog&gt;</code> API.
      </p>

      <div style="margin-top: 1.25rem;">
        <label for="backstage-search" style="display: block; font-weight: 800; margin-bottom: 0.4rem;">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Search Dossiers, Campus Locations, &amp; Administrative Correspondence (${items.length} Records):
        </label>
        <input
          type="search"
          id="backstage-search"
          placeholder="Search for 'Commonwealth Polytechnic Institute', 'Kelsey Brennan', 'Isabel Dawson', 'Room 214', 'Vectron', 'Electric Color'..."
          style="width: 100%; padding: 0.75rem 1rem; border-radius: 0.6rem; border: 1px solid var(--bs-border); background: var(--bs-bg); color: var(--bs-text); font-size: 1rem;"
        />
      </div>
    </section>

    <section aria-labelledby="features-heading">
      <h2 id="features-heading" style="font-size: 1.45rem; margin: 1.5rem 0 0.75rem;">
        <i class="fa-solid fa-compass-drafting" aria-hidden="true"></i> Featured Locations, Lore &amp; Behind-the-Scenes Dossiers
      </h2>
      <div class="bs-grid">
        ${featureItems.map(renderCard).join('\n')}
      </div>
    </section>

    <section aria-labelledby="correspondence-heading">
      <h2 id="correspondence-heading" style="font-size: 1.45rem; margin: 1.5rem 0 0.75rem;">
        <i class="fa-solid fa-envelopes-bulk" aria-hidden="true"></i> The Eleventh Child — CPI Administrative &amp; Residence Life Correspondence (${correspondenceItems.length})
      </h2>
      <p style="color: var(--bs-muted); margin-top: 0;">
        Extracted from the main narrative of <a href="https://books.raggiesoft.com/aubrie" class="bs-link"><em>The Eleventh Child: The Story of Jordan</em></a> so the novel stays tightly locked to Jordan's lived perspective while allowing readers to inspect every OEA, Housing, Radford Transit, and EHS email on demand via in-reader <code>&lt;dialog&gt;</code> modals.
      </p>
      <div class="bs-grid">
        ${correspondenceItems.map(renderCard).join('\n')}
      </div>
    </section>
  `;

  return renderBackstageShell({
    title: 'RaggieSoft Backstage | Bonus Features & Lore Archive',
    description:
      'Immersive in-universe bonus features, CPI campus guide, and background correspondence PWA for RaggieSoft Books and Engine Room Records.',
    canonicalPath: '/',
    bodyHtml
  });
}

/**
 * Generates `/manifest.json` and `/sw.js` for the RaggieSoft Backstage PWA.
 */
function buildPwaAssets(items) {
  const manifest = {
    name: 'RaggieSoft Backstage — Bonus Features & Archive',
    short_name: 'RS Backstage',
    description:
      'Immersive in-universe bonus features, Commonwealth Polytechnic Institute (CPI) dossier, and correspondence archive for RaggieSoft properties.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#070b14',
    theme_color: '#861f41',
    icons: [
      {
        src: 'https://assets.raggiesoft.com/raggiesoft-corporate/images/logos/raggiesoft-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };

  const preCacheUrls = [
    '/',
    '/assets/backstage.css?v=20261024a',
    '/assets/backstage-client.js?v=20261024a',
    '/api/v1/index.json',
    ...items.map((i) => i.routePath),
    ...items.map((i) => `/api/v1/${i.slug}.json`)
  ];

  const swJs = `/**
 * @license MIT
 * sw.js — Offline-First Progressive Web App Service Worker for backstage.raggiesoft.com
 */
const CACHE_NAME = 'raggiesoft-backstage-v20261024a';
const PRECACHE_URLS = ${JSON.stringify(preCacheUrls, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
`;

  writeDistFile('manifest.json', JSON.stringify(manifest, null, 2));
  writeDistFile('sw.js', swJs);
}

/**
 * Executes the full RaggieSoft Backstage build.
 */
function buildBackstageSite() {
  const items = loadBackstageItems();

  // 1. Write CSS, Client JS, and PWA Manifest / Service Worker
  writeDistFile('assets/backstage.css', buildBackstageCss());
  writeDistFile('assets/backstage-client.js', buildBackstageClientJs());
  buildPwaAssets(items);

  // 2. Write Home Page (`/index.html`)
  writeDistFile('index.html', renderHomePage(items));

  // 3. Write each item route (`/<slug>/index.html`) and JSON API (`/api/v1/<slug>.json`)
  const apiIndex = {
    generatedAt: new Date().toISOString(),
    siteName: 'RaggieSoft Backstage',
    baseUrl: 'https://backstage.raggiesoft.com',
    totalItems: items.length,
    items: {}
  };

  // Optional shared CDN mirror directory in `/raggiesoft-assets/raggiesoft-backstage/api/v1`
  const sharedAssetsRoot = path.resolve(projectRoot, '../../../raggiesoft-assets/raggiesoft-backstage/api/v1');
  const canMirrorToAssets = fs.existsSync(path.resolve(projectRoot, '../../../raggiesoft-assets'));

  for (const item of items) {
    const htmlPage = renderItemPage(item, items);
    writeDistFile(`${item.slug}/index.html`, htmlPage);

    const apiPayload = {
      slug: item.slug,
      routePath: item.routePath,
      canonicalUrl: item.canonicalUrl,
      title: item.title,
      subtitle: item.subtitle,
      category: item.category,
      property: item.property,
      date: item.date,
      time: item.time,
      location: item.location,
      sender: item.sender,
      recipient: item.recipient,
      subject: item.subject,
      relatedBookUrl: item.relatedBookUrl,
      relatedBookLabel: item.relatedBookLabel,
      summary: item.summary,
      html: item.html
    };

    const jsonStr = JSON.stringify(apiPayload, null, 2);
    writeDistFile(`api/v1/${item.slug}.json`, jsonStr);

    if (canMirrorToAssets) {
      const mirrorPath = path.join(sharedAssetsRoot, `${item.slug}.json`);
      fs.mkdirSync(path.dirname(mirrorPath), { recursive: true });
      fs.writeFileSync(mirrorPath, jsonStr, 'utf-8');
    }

    apiIndex.items[item.slug] = {
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle,
      category: item.category,
      date: item.date,
      time: item.time,
      sender: item.sender,
      subject: item.subject,
      summary: item.summary,
      canonicalUrl: item.canonicalUrl,
      apiUrl: item.apiUrl
    };
  }

  const indexJsonStr = JSON.stringify(apiIndex, null, 2);
  writeDistFile('api/v1/index.json', indexJsonStr);
  if (canMirrorToAssets) {
    fs.mkdirSync(sharedAssetsRoot, { recursive: true });
    fs.writeFileSync(path.join(sharedAssetsRoot, 'index.json'), indexJsonStr, 'utf-8');
  }

  // 4. Generate sitemap.xml and robots.txt
  const today = new Date().toISOString().split('T')[0];
  const urls = ['https://backstage.raggiesoft.com', ...items.map((i) => i.canonicalUrl)];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${escapeHtml(u)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
    .join('\n')}\n</urlset>\n`;
  writeDistFile('sitemap.xml', sitemapXml);
  writeDistFile(
    'robots.txt',
    `User-agent: *\nAllow: /\nSitemap: https://backstage.raggiesoft.com/sitemap.xml\n`
  );

  console.log(
    `✅ Built backstage.raggiesoft.com static PWA & JSON API bundle in ${distDir} (${items.length} Backstage dossiers & correspondence endpoints compiled).`
  );
}

buildBackstageSite();

if (process.argv.includes('--serve')) {
  const port = Number(process.env.PORT || 4328);
  const server = http.createServer((req, res) => {
    const urlPath = (req.url || '/').split('?')[0];
    let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    const mime =
      ext === '.css'
        ? 'text/css; charset=utf-8'
        : ext === '.js'
          ? 'application/javascript; charset=utf-8'
          : ext === '.json'
            ? 'application/json; charset=utf-8'
            : ext === '.xml'
              ? 'application/xml; charset=utf-8'
              : 'text/html; charset=utf-8';
    res.writeHead(200, {
      'Content-Type': mime,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(fs.readFileSync(filePath));
  });
  server.listen(port, () => {
    console.log(`🚀 RaggieSoft Backstage preview server running at http://localhost:${port}`);
  });
}
