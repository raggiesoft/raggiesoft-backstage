/**
 * @license MIT
 * ============================================================================
 * scripts/build.mjs — RaggieSoft Backstage (backstage.raggiesoft.com)
 * ============================================================================
 * Architectural Overview:
 * Flagship Web Awesome Pro 3.13.0 (`bb765cf132c5414e`) and Font Awesome Pro+
 * (`ec060982d4`) Static Site Generation (SSG) compiler, Progressive Web App
 * (PWA) bundler, OpenGraph social-card linker, and Cross-Origin JSON API
 * generator for RaggieSoft Backstage (`https://backstage.raggiesoft.com/`).
 *
 * Showcase Highlights (Web Awesome Pro 3.13.0 + Font Awesome Pro+):
 * 1. Full Application Layout (`<wa-page>`): Scaffolds `banner`, single-row
 *    47px sticky `header`, breadcrumb `subheader`, main reading canvas,
 *    sticky `aside` ("On This Page & Companion Links" rail), and `footer`.
 * 2. Stackable Theme & Palette Studio (`<wa-drawer>`, `<wa-radio-group>`,
 *    `<wa-radio>`): Live zero-reload switching across 5 Web Awesome Pro
 *    themes (`default`, `awesome`, `glossy`, `mellow`, `premium`), 4 Pro
 *    color palettes (`default`, `elegant`, `natural`, `vogue`), and 3-state
 *    lighting (`system`, `light`, `dark`) synchronized with `<meta name="color-scheme">`
 *    and `.wa-dark`.
 * 3. Featured Scenes Showcase (`<wa-carousel>`, `<wa-carousel-item>`):
 *    Widescreen visual tour across Bear & Bug Sanctuary, the May 1999 Wingman
 *    Briefing (Ashley Raybourn & Bonnie Reed), Katie & Nate in the U.S. Senate,
 *    CPI Blacksburg landmarks, Suite 214/216, and The Stardust Engine.
 * 4. Interactive Archival Ledger (`<wa-data-grid>`): Full client-side Pro data
 *    grid with global search, sortable/filterable/resizable/reorderable/pinnable
 *    columns, column visibility menu, expandable `rowDetail` dossier cards,
 *    collection grouping (`groupBy`), pagination, and safe CSV spreadsheet
 *    export (`exportDataAsCsv({ escapeFormulas: true })`).
 * 5. Story Timeline & Collection Analytics (`<wa-bar-chart>`,
 *    `<wa-doughnut-chart>`, `<wa-sparkline>`): 100% live-computed breakdown of
 *    archival records across narrative eras (1872–2044) and collections, paired
 *    with expandable semantic HTML `<table>` summaries (`<wa-details>`).
 * 6. Hierarchical Folder Explorer (`<wa-tree>`, `<wa-tree-item>`): Interactive
 *    archive tree paired with a live dossier inspector card.
 * 7. Full Installable PWA Parity: Dedicated rounded-squircle + maskable icons,
 *    92 Light & Dark iOS/iPadOS startup splash screens, one-click Install App
 *    support (Chromium `beforeinstallprompt` + iOS Safari guide `<wa-dialog>`),
 *    and a tiered `NetworkFirst` / `StaleWhileRevalidate` / `CacheFirst`
 *    Service Worker (`/sw.js`).
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const distDir = path.join(projectRoot, 'dist');
const snapshotPath = path.join(projectRoot, 'src', 'data', 'backstage-snapshot.json');

/**
 * Cache-buster revision token shared by HTML asset links, PWA splash screens, and `/sw.js`.
 */
const ASSET_VERSION = '20261114d';

/**
 * Web Awesome Pro 3.13.0 CDN base URL (`bb765cf132c5414e`) & Font Awesome Pro+ Kit (`ec060982d4`).
 */
const WA_PRO_BASE = 'https://ka-p.webawesome.com/kit/bb765cf132c5414e/webawesome@3.13.0';
const FA_PRO_KIT_CODE = 'ec060982d4';
const OG_CDN_BASE = 'https://assets.raggiesoft.com/raggiesoft-backstage/images/og';
const PWA_CDN_BASE = 'https://assets.raggiesoft.com/raggiesoft-backstage/images/pwa-icons';

/**
 * Complete table of 23 iOS / iPadOS device viewport specs generating all 92
 * (23 devices × 2 orientations × 2 color schemes) startup splash `<link>` tags.
 */
const IOS_SPLASH_SPECS = [
  { dw: 1024, dh: 1366, dpr: 2, pw: 2048, ph: 2732 },
  { dw: 1032, dh: 1376, dpr: 2, pw: 2064, ph: 2752 },
  { dw: 834, dh: 1210, dpr: 2, pw: 1668, ph: 2420 },
  { dw: 834, dh: 1194, dpr: 2, pw: 1668, ph: 2388 },
  { dw: 834, dh: 1112, dpr: 2, pw: 1668, ph: 2224 },
  { dw: 768, dh: 1024, dpr: 2, pw: 1536, ph: 2048 },
  { dw: 820, dh: 1180, dpr: 2, pw: 1640, ph: 2360 },
  { dw: 810, dh: 1080, dpr: 2, pw: 1620, ph: 2160 },
  { dw: 744, dh: 1133, dpr: 2, pw: 1488, ph: 2266 },
  { dw: 440, dh: 956, dpr: 3, pw: 1320, ph: 2868 },
  { dw: 402, dh: 874, dpr: 3, pw: 1206, ph: 2622 },
  { dw: 420, dh: 912, dpr: 3, pw: 1260, ph: 2736 },
  { dw: 430, dh: 932, dpr: 3, pw: 1290, ph: 2796 },
  { dw: 393, dh: 852, dpr: 3, pw: 1179, ph: 2556 },
  { dw: 390, dh: 844, dpr: 3, pw: 1170, ph: 2532 },
  { dw: 428, dh: 926, dpr: 3, pw: 1284, ph: 2778 },
  { dw: 360, dh: 780, dpr: 3, pw: 1080, ph: 2340 },
  { dw: 414, dh: 896, dpr: 3, pw: 1242, ph: 2688 },
  { dw: 375, dh: 812, dpr: 3, pw: 1125, ph: 2436 },
  { dw: 414, dh: 896, dpr: 2, pw: 828, ph: 1792 },
  { dw: 414, dh: 736, dpr: 3, pw: 1242, ph: 2208 },
  { dw: 375, dh: 667, dpr: 2, pw: 750, ph: 1334 },
  { dw: 320, dh: 568, dpr: 2, pw: 640, ph: 1136 }
];

/**
 * Escapes HTML special characters for safe interpolation in attributes and text nodes.
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
 * Safely serializes an object for embedding inside a `<script>` block without
 * premature `</script>` termination or HTML comment injection.
 * @param {unknown} value
 * @returns {string}
 */
function safeJsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Trims text cleanly at a word boundary within `maxLen` characters for SEO & OpenGraph tags.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
function clampMetaText(str, maxLen) {
  const clean = String(str ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > maxLen * 0.6 ? sliced.slice(0, lastSpace) : sliced).replace(/[.,;:—–-]+$/, '')}…`;
}

/**
 * Generates a clean URL-safe anchor slug from heading text.
 * @param {string} raw
 * @returns {string}
 */
function slugifyHeading(raw) {
  const stripped = String(raw ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~[\]()]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return stripped || 'section';
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
 * Recursively copies static files from `public/` (`favicon.ico`, `icons/*`) into `dist/`.
 * @param {string} srcDir
 * @param {string} destDir
 */
function copyDirectoryRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Resolves the dedicated `sips`-verified `1200x630` OpenGraph JPEG card for any Backstage route.
 * @param {string} slug
 * @param {string} [explicitOg]
 * @returns {string}
 */
function resolveOgImageForSlug(slug, explicitOg = '') {
  if (explicitOg) return explicitOg;
  const exactMap = {
    '': `${OG_CDN_BASE}/backstage-hub-og.jpg`,
    'books/rachel': `${OG_CDN_BASE}/rachel-collection-og.jpg`,
    'books/rachel/the-bug-and-bear-dynamic-and-base-camp-protocols': `${OG_CDN_BASE}/rachel-collection-og.jpg`,
    'books/rachel/the-wingman-briefing-ashley-and-bonnie': `${OG_CDN_BASE}/rachel-wingman-og.jpg`,
    'books/rachel/david-miller-precinct-interview-and-warehouse-raid': `${OG_CDN_BASE}/rachel-david-miller-og.jpg`,
    'books/rachel/confidential-school-nurse-briefing-and-tiered-iep-addenda': `${OG_CDN_BASE}/rachel-nurse-iep-og.jpg`,
    'books/rachel/seonduwon-diplomatic-shield-and-pamyun-verdict': `${OG_CDN_BASE}/rachel-seonduwon-og.jpg`,
    'books/rachel/sloanes-punishment-and-the-brigadoon-rumor-sabotage': `${OG_CDN_BASE}/rachel-sloane-brigadoon-og.jpg`,
    'books/rachel/black-friday-1999-and-toms-two-am-christmas-drop': `${OG_CDN_BASE}/rachel-black-friday-christmas-og.jpg`,
    'books/rachel/the-quantum-dossier-jessica-progman-and-william-keswick': `${OG_CDN_BASE}/rachel-quantum-og.jpg`,
    'books/rachel/canadian-arch-sanctuary-anchor-rotation-and-lynnhaven-seondu': `${OG_CDN_BASE}/rachel-canadian-arch-og.jpg`,
    'books/rachel/code-susquehanna-and-the-bear-and-bug-vault': `${OG_CDN_BASE}/rachel-susquehanna-og.jpg`,
    'books/katie': `${OG_CDN_BASE}/katie-collection-og.jpg`,
    'books/katie/dirksen-room-511-sterling-and-cross-panic': `${OG_CDN_BASE}/katie-dirksen-room-511-og.jpg`,
    'books/aubrie': `${OG_CDN_BASE}/aubrie-collection-og.jpg`,
    'locations/cpi': `${OG_CDN_BASE}/cpi-campus-og.jpg`,
    'music/stardust-engine-origins': `${OG_CDN_BASE}/stardust-origins-og.jpg`,
    'corporations/vectron-question-the-rules': `${OG_CDN_BASE}/vectron-archive-og.jpg`
  };
  if (exactMap[slug]) return exactMap[slug];
  if (slug.startsWith('books/rachel/')) return `${OG_CDN_BASE}/rachel-collection-og.jpg`;
  if (slug.startsWith('books/katie/')) return `${OG_CDN_BASE}/katie-collection-og.jpg`;
  if (slug.startsWith('books/aubrie/')) return `${OG_CDN_BASE}/aubrie-collection-og.jpg`;
  return `${OG_CDN_BASE}/backstage-hub-og.jpg`;
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
 * Note: Rendered HTML is also consumed cross-origin inside `books.raggiesoft.com`,
 * so inline chips use standard semantic `<span>` + Font Awesome classes that
 * work both standalone and inside Web Awesome pages.
 * @param {string} text
 * @returns {string}
 */
function renderInlineMarkdown(text) {
  const tokens = [];
  const stash = (html) => {
    const id = `\u0000TOK${tokens.length}\u0000`;
    tokens.push(html);
    return id;
  };

  let working = String(text ?? '');

  // Preserve explicit line breaks
  working = working.replace(/<br\s*\/?>/gi, () => stash('<br />'));

  // Custom in-universe speech/signage tags (<aac>, <pa>, <led>)
  working = working.replace(/<aac>([\s\S]*?)<\/aac>/gi, (_, inner) =>
    stash(
      `<span class="bs-aac-chip" role="note" aria-label="Synthesized tablet speech"><i class="fa-solid fa-tablet-screen-button" aria-hidden="true"></i> ${escapeHtml(inner)}</span>`
    )
  );
  working = working.replace(/<pa>([\s\S]*?)<\/pa>/gi, (_, inner) =>
    stash(
      `<span class="bs-pa-chip"><i class="fa-solid fa-walkie-talkie" aria-hidden="true"></i> ${escapeHtml(inner)}</span>`
    )
  );
  working = working.replace(/<led>([\s\S]*?)<\/led>/gi, (_, inner) =>
    stash(`<span class="bs-led-sign">${escapeHtml(inner)}</span>`)
  );

  // Inline code fragments
  working = working.replace(/`([^`]+)`/g, (_, code) =>
    stash(`<code class="bs-inline-code">${escapeHtml(code)}</code>`)
  );

  // Markdown links [label](href)
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

  // Bold + Italic (***text***), Bold (**text**), Italic (*text*)
  working = working.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  working = working.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  working = working.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  working = working.replace(/\\_/g, '_');
  working = working.replace(/\\\$/g, '$');

  // Restore stashed HTML tokens
  working = working.replace(/\u0000TOK(\d+)\u0000/g, (_, idx) => tokens[Number(idx)] ?? '');

  return working;
}

/**
 * Converts a Backstage Markdown body into semantic HTML with specialized
 * styling for standalone `<figure>` scene illustrations, in-universe CPI
 * administrative emails (`> **To:**`, `> **From:**`), and institutional filings,
 * preserving strict sequential heading levels (`<h2>` -> `<h3>`) and extracting
 * `<h2>` table-of-contents anchors for `<wa-page slot="aside">`.
 * @param {string} md
 * @param {{ id: string, text: string }[]} [tocOut]
 * @returns {string}
 */
function renderMarkdownToHtml(md, tocOut = null) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const htmlBlocks = [];
  const usedIds = new Set();
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code blocks (focusable via tabindex="0" when horizontally scrollable)
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
        `<pre class="bs-code-block" tabindex="0" data-lang="${escapeHtml(lang || 'text')}"><code>${escapeHtml(
          codeLines.join('\n')
        )}</code></pre>`
      );
      continue;
    }

    // Standalone Markdown image block: ![alt](src) -> accessible <figure> + <figcaption>
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const altText = imgMatch[1].trim();
      const imgSrc = imgMatch[2].trim();
      htmlBlocks.push(`
        <figure class="bs-inline-figure">
          <img
            src="${escapeHtml(imgSrc)}"
            alt="${escapeHtml(altText)}"
            width="1408"
            height="768"
            loading="lazy"
            class="bs-inline-img"
          />
          ${altText ? `<figcaption class="bs-inline-caption">${escapeHtml(altText)}</figcaption>` : ''}
        </figure>
      `);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      htmlBlocks.push('<hr class="bs-divider" />');
      i++;
      continue;
    }

    // Sequential headings: `#` or `##` -> `<h2>`, `###` -> `<h3>`, `####` -> `<h4>`
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.max(2, Math.min(headingMatch[1].length, 4));
      const text = headingMatch[2];
      const baseSlug = `sec-${slugifyHeading(text)}`;
      let uniqueId = baseSlug;
      let suffix = 2;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${baseSlug}-${suffix++}`;
      }
      usedIds.add(uniqueId);

      if (tocOut && level === 2) {
        const plainLabel = text
          .replace(/<[^>]+>/g, '')
          .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .trim();
        tocOut.push({ id: uniqueId, text: plainLabel });
      }

      htmlBlocks.push(
        `<h${level} id="${escapeHtml(uniqueId)}" class="bs-heading bs-h${level}">${renderInlineMarkdown(text)}</h${level}>`
      );
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
      const isEmailHeader = /\*\*(To|From|Date|Subject|Reference|Reference No\.):\*\*/i.test(joinedQuote);
      const isEhsReport =
        /ENVIRONMENTAL HEALTH & SAFETY|OFFICIAL JOINT ADMINISTRATIVE COMPLAINT|OFFICIAL GOOD-FAITH REMEDIATION/i.test(
          joinedQuote
        );
      const innerHtml = renderMarkdownToHtml(joinedQuote, null);

      if (isEmailHeader || isEhsReport) {
        const badgeLabel = isEhsReport
          ? 'Official Institutional Filing / EHS Record'
          : 'Encrypted CPI Administrative Mail Dispatch';
        const iconClass = isEhsReport ? 'fa-solid fa-file-shield' : 'fa-solid fa-envelope-open-text';
        htmlBlocks.push(`
          <div class="bs-email-card" role="group" aria-label="${escapeHtml(badgeLabel)}">
            <div class="bs-email-card-bar">
              <span class="bs-email-card-badge">
                <i class="${iconClass}" aria-hidden="true"></i> ${escapeHtml(badgeLabel)}
              </span>
              <span class="bs-email-card-seal"><i class="fa-solid fa-badge-check" aria-hidden="true"></i> VERIFIED ARCHIVE</span>
            </div>
            <div class="bs-email-card-body">
              ${innerHtml}
            </div>
          </div>
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
      const listItems = [];

      while (i < lines.length) {
        const cur = lines[i];
        const curTrim = cur.trim();
        if (!curTrim) break;
        const itemMatch = curTrim.match(isOrdered ? /^\d+\.\s+(.+)$/ : /^(\*|-)\s+(.+)$/);
        if (itemMatch) {
          const itemText = isOrdered ? itemMatch[1] : itemMatch[2];
          listItems.push([itemText]);
          i++;
        } else if (listItems.length > 0 && (/^\s{2,}/.test(cur) || /^(\*|-)\s+/.test(curTrim))) {
          listItems[listItems.length - 1].push(curTrim.replace(/^(\*|-)\s+/, '• '));
          i++;
        } else {
          break;
        }
      }

      const lis = listItems
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
      !/^!\[([^\]]*)\]\(([^)]+)\)$/.test(lines[i].trim()) &&
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
 * Normalizes legacy RaggieSoft Book Reader (`/books/<slug>`) and Listening Room
 * (`?track=<id>` or legacy album slugs) URLs into their canonical single-hop routes.
 * @param {string} rawText
 * @returns {string}
 */
function canonicalizeRaggieSoftUrlsInText(rawText) {
  return String(rawText ?? '')
    .replace(/https:\/\/books\.raggiesoft\.com\/books\/([a-z0-9\/-]+)/gi, 'https://books.raggiesoft.com/$1')
    .replace(
      'https://music.raggiesoft.com/the-paper-wall/2003-eleventh-child-book-2?track=1-02-an-80s-education',
      'https://music.raggiesoft.com/the-paper-wall/2003-eleventh-child-book-2/an-80s-education-the-brooks-mix'
    )
    .replace(
      /https:\/\/music\.raggiesoft\.com\/(?:artists\/)?([a-z0-9-]+)\/([a-z0-9-]+)\?track=([a-z0-9-]+)/gi,
      (_, art, alb, trk) => {
        const cleanSlug = String(trk)
          .toLowerCase()
          .replace(/^\d+-\d+-/, '')
          .replace(/^\d+-/, '');
        return `https://music.raggiesoft.com/${art.toLowerCase()}/${alb.toLowerCase()}/${cleanSlug}`;
      }
    );
}

/**
 * Classifies an item into its reader-friendly collection group and Font Awesome Pro+ icon spec.
 * @param {Record<string, any>} item
 */
function describeCollection(item) {
  if (item.slug.startsWith('books/rachel')) {
    return {
      key: 'rachel',
      label: 'The Rachel Narrative',
      badgeVariant: 'success',
      iconFamily: 'duotone',
      iconName: 'shield-heart'
    };
  }
  if (item.slug.startsWith('books/katie')) {
    return {
      key: 'katie',
      label: 'Katie & Nathaniel',
      badgeVariant: 'brand',
      iconFamily: 'duotone',
      iconName: 'wheelchair-move'
    };
  }
  if (item.slug.startsWith('books/aubrie/correspondence/')) {
    return {
      key: 'aubrie',
      label: 'The Eleventh Child • Correspondence',
      badgeVariant: 'neutral',
      iconFamily: 'duotone',
      iconName: 'envelope-open-text'
    };
  }
  if (item.slug.startsWith('books/aubrie')) {
    return {
      key: 'aubrie',
      label: 'The Eleventh Child • Dossier',
      badgeVariant: 'brand',
      iconFamily: 'duotone',
      iconName: 'book-sparkles'
    };
  }
  if (item.slug.startsWith('music/')) {
    return {
      key: 'lore',
      label: 'Engine Room Records & Music',
      badgeVariant: 'warning',
      iconFamily: 'duotone',
      iconName: 'compact-disc'
    };
  }
  if (item.slug.startsWith('corporations/')) {
    return {
      key: 'lore',
      label: 'Corporate & Legal Archives',
      badgeVariant: 'neutral',
      iconFamily: 'duotone',
      iconName: 'scale-balanced'
    };
  }
  return {
    key: 'lore',
    label: 'Campus & Architecture',
    badgeVariant: 'success',
    iconFamily: 'duotone',
    iconName: 'building-columns'
  };
}

/**
 * Loads all Backstage Markdown items from `/raggiesoft-narratives/backstage`
 * (or falls back to `src/data/backstage-snapshot.json` on the Droplet).
 */
function loadBackstageItems() {
  const candidates = [
    path.resolve(projectRoot, '../../../raggiesoft-novels/backstage'),
    path.resolve(projectRoot, '../../raggiesoft-novels/backstage'),
    path.resolve(projectRoot, '../raggiesoft-novels/backstage'),
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
      const { frontmatter, body: rawBody } = parseFrontmatter(raw);
      const body = canonicalizeRaggieSoftUrlsInText(rawBody);
      let slug = relFile.replace(/\.md$/, '');
      if (slug.endsWith('/index')) {
        slug = slug.slice(0, -'/index'.length);
      }
      const routePath = `/${slug}`;
      const toc = [];
      const html = renderMarkdownToHtml(body, toc);
      const image = frontmatter.image || '';
      const imageAlt = frontmatter.imageAlt || frontmatter.title || '';
      const ogImage = resolveOgImageForSlug(slug, frontmatter.ogImage || '');

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
        relatedBookUrl: canonicalizeRaggieSoftUrlsInText(frontmatter.relatedBookUrl || ''),
        relatedBookLabel: frontmatter.relatedBookLabel || 'Return to RaggieSoft Book Reader',
        image,
        imageAlt,
        ogImage,
        summary: frontmatter.summary || frontmatter.subtitle || frontmatter.title || '',
        toc,
        markdown: body,
        html
      };
    });

    // Sort items chronologically within collections when dates are present while keeping hubs deterministic
    items.sort((a, b) => {
      const aHub = a.slug === 'books/rachel' || a.slug === 'books/katie' || a.slug === 'books/aubrie' ? 0 : 1;
      const bHub = b.slug === 'books/rachel' || b.slug === 'books/katie' || b.slug === 'books/aubrie' ? 0 : 1;
      if (aHub !== bHub) return aHub - bHub;
      if (a.date && b.date && a.date !== b.date) return a.date.localeCompare(b.date);
      return a.slug.localeCompare(b.slug);
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
 * Generates `/assets/backstage.css` — modern layered CSS architecture bridging
 * Web Awesome Pro 3.13.0 `<wa-page>` and design tokens (`--wa-color-*`, `--wa-border-radius-*`)
 * with high-contrast fallbacks, `<meta name="color-scheme">` `:has()` synchronization,
 * `light-dark()` progressive enhancement, and Windows High Contrast (`forced-colors`) support.
 * @returns {string}
 */
function buildBackstageCss() {
  return `/**
 * @license MIT
 * ============================================================================
 * /assets/backstage.css — RaggieSoft Backstage (backstage.raggiesoft.com)
 * ============================================================================
 * Layered modern CSS architecture harmonizing directly with Web Awesome Pro
 * 3.13.0 <wa-page>, themes (default, awesome, glossy, mellow, premium), and
 * color palettes (default, elegant, natural, vogue) alongside Font Awesome Pro+.
 * ============================================================================
 */

@layer base, theme, components, utilities;

@layer theme {
  :root {
    color-scheme: light dark;

    /* Sync CSS color-scheme property with <meta name="color-scheme"> override */
    &:has(> head > meta[name="color-scheme"][content="dark"]) {
      color-scheme: dark;
    }
    &:has(> head > meta[name="color-scheme"][content="light"]) {
      color-scheme: light;
    }

    /* High-contrast fallback palette (Light default, >= 4.5:1 text contrast) */
    --bs-fallback-bg: #f4f6fb;
    --bs-fallback-surface: #ffffff;
    --bs-fallback-elevated: #edf1f8;
    --bs-fallback-text: #0f172a;
    --bs-fallback-muted: #334155;
    --bs-fallback-border: #cbd5e1;
    --bs-fallback-primary: #861f41;
    --bs-fallback-primary-fg: #ffffff;
    --bs-fallback-accent: #b45309;
    --bs-fallback-link: #7a1938;
    --bs-email-bg: #fffdf9;
    --bs-email-bar: #f1f5f9;
    --bs-email-border: #94a3b8;
    --bs-aac-bg: #eff6ff;
    --bs-aac-fg: #1e3a8a;
    --bs-aac-border: #93c5fd;
    --bs-shadow: 0 10px 30px rgba(15, 23, 42, 0.07);
    --bs-hero-glow: radial-gradient(circle at top right, rgba(134, 31, 65, 0.1), transparent 58%);

    @media (prefers-color-scheme: dark) {
      --bs-fallback-bg: #070b14;
      --bs-fallback-surface: #0f172a;
      --bs-fallback-elevated: #172238;
      --bs-fallback-text: #f8fafc;
      --bs-fallback-muted: #cbd5e1;
      --bs-fallback-border: #334155;
      --bs-fallback-primary: #f59e0b;
      --bs-fallback-primary-fg: #0f172a;
      --bs-fallback-accent: #38bdf8;
      --bs-fallback-link: #7dd3fc;
      --bs-email-bg: #0b1324;
      --bs-email-bar: #15223a;
      --bs-email-border: #475569;
      --bs-aac-bg: rgba(56, 189, 248, 0.14);
      --bs-aac-fg: #bae6fd;
      --bs-aac-border: rgba(56, 189, 248, 0.48);
      --bs-shadow: 0 16px 40px rgba(0, 0, 0, 0.42);
      --bs-hero-glow: radial-gradient(circle at top right, rgba(245, 158, 11, 0.14), transparent 58%);
    }

    @supports (color: light-dark(white, black)) {
      --bs-fallback-bg: light-dark(#f4f6fb, #070b14);
      --bs-fallback-surface: light-dark(#ffffff, #0f172a);
      --bs-fallback-elevated: light-dark(#edf1f8, #172238);
      --bs-fallback-text: light-dark(#0f172a, #f8fafc);
      --bs-fallback-muted: light-dark(#334155, #cbd5e1);
      --bs-fallback-border: light-dark(#cbd5e1, #334155);
      --bs-fallback-primary: light-dark(#861f41, #f59e0b);
      --bs-fallback-primary-fg: light-dark(#ffffff, #0f172a);
      --bs-fallback-accent: light-dark(#b45309, #38bdf8);
      --bs-fallback-link: light-dark(#7a1938, #7dd3fc);
      --bs-email-bg: light-dark(#fffdf9, #0b1324);
      --bs-email-bar: light-dark(#f1f5f9, #15223a);
      --bs-email-border: light-dark(#94a3b8, #475569);
      --bs-aac-bg: light-dark(#eff6ff, rgba(56, 189, 248, 0.14));
      --bs-aac-fg: light-dark(#1e3a8a, #bae6fd);
      --bs-aac-border: light-dark(#93c5fd, rgba(56, 189, 248, 0.48));
    }

    /* Bridge semantic tokens directly to Web Awesome Pro 3.13.0 theme/palette variables */
    --bs-bg: var(--wa-color-surface-lowered, var(--bs-fallback-bg));
    --bs-surface: var(--wa-color-surface-default, var(--bs-fallback-surface));
    --bs-elevated: var(--wa-color-neutral-fill-quiet, var(--bs-fallback-elevated));
    --bs-text: var(--wa-color-text-normal, var(--bs-fallback-text));
    --bs-muted: var(--bs-fallback-muted);
    --bs-border: var(--wa-color-surface-border, var(--bs-fallback-border));
    --bs-primary: var(--wa-color-brand-fill-loud, var(--bs-fallback-primary));
    --bs-primary-fg: var(--bs-fallback-primary-fg);
    --bs-accent: var(--bs-fallback-accent);
    --bs-link: var(--bs-fallback-link);
    --bs-radius-m: var(--wa-border-radius-m, 0.65rem);
    --bs-radius-l: 1rem;
    accent-color: var(--bs-primary);
  }

  @media (forced-colors: active) {
    :root {
      --bs-bg: Canvas;
      --bs-surface: Canvas;
      --bs-elevated: Canvas;
      --bs-text: CanvasText;
      --bs-muted: CanvasText;
      --bs-border: ButtonBorder;
      --bs-primary: Highlight;
      --bs-primary-fg: HighlightText;
      --bs-link: LinkText;
      --bs-shadow: none;
      --bs-hero-glow: none;
    }
  }
}

@layer base {
  html {
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }

  body {
    margin: 0;
    min-block-size: 100dvh;
    background-color: var(--bs-bg);
    color: var(--bs-text);
    font-family: var(--wa-font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    line-height: 1.7;
  }

  /* Zero-FOUC fallback before <wa-page> custom element upgrades */
  wa-page:not(:defined) {
    display: flex;
    flex-direction: column;
    min-block-size: 100dvh;
  }

  wa-page:not(:defined) [slot="aside"] {
    display: none;
  }

  /* Hide cross-property network bar when installed as a standalone Home Screen / Desktop App */
  @media (display-mode: standalone) {
    .rs-network-bar {
      display: none !important;
    }
  }

  :where(a:any-link, button, summary, [tabindex="0"]):focus-visible {
    outline: 3px solid var(--bs-accent);
    outline-offset: 3px;
  }
}

@layer utilities {
  .visually-hidden:where(:not(:focus-within, :active)) {
    position: absolute !important;
    clip-path: inset(50%) !important;
    overflow: hidden !important;
    inline-size: 1px !important;
    block-size: 1px !important;
    margin: -1px !important;
    padding: 0 !important;
    border: 0 !important;
    white-space: nowrap !important;
  }
}

@layer components {
  /* Web Awesome Pro 3.13.0 <wa-page> Application Frame */
  wa-page.bs-page {
    --header-height: 2.95rem;
    --main-width: minmax(0, 1fr);
    --aside-width: 18.5rem;
    min-block-size: 100dvh;
    background-color: var(--bs-bg);
    color: var(--bs-text);
  }

  wa-page.bs-page::part(banner),
  wa-page.bs-page::part(header),
  wa-page.bs-page::part(subheader),
  wa-page.bs-page::part(footer) {
    padding: 0;
    border: none;
    background: transparent;
  }

  wa-page.bs-page::part(body) {
    inline-size: 100%;
    max-inline-size: 1280px;
    margin-inline: auto;
    box-sizing: border-box;
  }

  wa-page.bs-page::part(main),
  wa-page.bs-page::part(main-content) {
    min-inline-size: 0;
    padding: 0;
  }

  wa-page.bs-page::part(aside) {
    padding-block: 1.75rem 2rem;
    padding-inline: 0 1.25rem;
  }

  @media (max-width: 1080px) {
    wa-page.bs-page {
      --aside-width: 0px;
    }
    wa-page.bs-page::part(aside) {
      display: none;
    }
  }

  .skip-link {
    position: fixed;
    inset-block-start: 0.75rem;
    inset-inline-start: 0.75rem;
    z-index: 9999;
    padding: 0.65rem 1.15rem;
    background: var(--bs-fallback-primary);
    color: var(--bs-fallback-primary-fg);
    font-weight: 800;
    border-radius: var(--bs-radius-m);
    text-decoration: none;
    border: 2px solid currentColor;
  }

  .skip-link:where(:not(:focus-within, :active)) {
    position: absolute;
    clip-path: inset(50%);
    overflow: hidden;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    white-space: nowrap;
  }

  .bs-container {
    inline-size: 100%;
    max-inline-size: 1220px;
    margin-inline: auto;
    padding-inline: 1.25rem;
    box-sizing: border-box;
  }

  /* Ultra-Compact Single-Row Sticky Header (47px Desktop & Mobile via @container) */
  .bs-header {
    inline-size: 100%;
    container: header / inline-size;
    background: color-mix(in oklab, var(--bs-surface) 92%, transparent);
    backdrop-filter: blur(12px);
    border-block-end: 1px solid var(--bs-border);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  }

  .bs-header-inner {
    display: flex;
    align-items: safe center;
    justify-content: space-between;
    gap: 0.55rem;
    padding-block: 0.38rem;
    min-block-size: 2.9rem;
    flex-wrap: nowrap;
  }

  .bs-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-inline-size: 0;
    flex: 0 1 auto;
    font-weight: 900;
    font-size: 0.96rem;
    letter-spacing: 0.01em;
    color: var(--bs-text);
    text-decoration: none;
    white-space: nowrap;
  }

  .bs-brand-icon {
    inline-size: 1.8rem;
    block-size: 1.8rem;
    border-radius: 0.44rem;
    flex: 0 0 auto;
    display: block;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
  }

  .bs-brand-prefix {
    display: none;
  }

  .bs-nav-row {
    display: flex;
    align-items: safe center;
    gap: 0.35rem;
    flex: 0 0 auto;
    margin-inline-start: auto;
    white-space: nowrap;
  }

  .bs-desktop-nav {
    display: none;
  }

  .bs-nav {
    display: flex;
    align-items: center;
    gap: 0.22rem;
    flex-wrap: nowrap;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .bs-nav-link {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    min-block-size: 2rem;
    padding: 0.22rem 0.56rem;
    border-radius: var(--bs-radius-m);
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--bs-muted);
    background: transparent;
    border: 1px solid transparent;
    text-decoration: none;
    transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
  }

  .bs-nav-link:hover {
    color: var(--bs-text);
    background: var(--bs-elevated);
    border-color: var(--bs-border);
  }

  .bs-nav-link[aria-current="page"] {
    background: var(--bs-fallback-primary);
    color: var(--bs-fallback-primary-fg);
    border-color: var(--bs-fallback-primary);
  }

  .bs-dropdown-desktop-label,
  .bs-install-label {
    display: none;
  }

  .bs-appearance-label {
    position: absolute;
    clip-path: inset(50%);
    overflow: hidden;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    white-space: nowrap;
  }

  @container header (inline-size >= 430px) {
    .bs-brand-prefix {
      display: inline;
    }
  }

  @container header (inline-size >= 560px) {
    .bs-appearance-label {
      position: static;
      clip-path: none;
      overflow: visible;
      inline-size: auto;
      block-size: auto;
      margin: 0;
    }
    .bs-install-label {
      display: inline;
    }
  }

  @container header (inline-size >= 980px) {
    .bs-desktop-nav {
      display: block;
    }
    .bs-dropdown-mobile-label {
      display: none;
    }
    .bs-dropdown-desktop-label {
      display: inline;
    }
  }

  /* <wa-page slot="subheader"> Breadcrumb Strip */
  .bs-subheader {
    inline-size: 100%;
    background: color-mix(in oklab, var(--bs-elevated) 84%, transparent);
    border-block-end: 1px solid var(--bs-border);
  }

  .bs-subheader-inner {
    padding-block: 0.45rem;
    font-size: 0.86rem;
  }

  /* <wa-page slot="aside"> Sticky Table of Contents & Story Companion Rail */
  .bs-aside-rail {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .bs-aside-card {
    --spacing: 1rem;
  }

  .bs-aside-heading {
    margin: 0 0 0.55rem;
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--bs-muted);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .bs-toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.87rem;
  }

  .bs-toc-link {
    display: block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.4rem;
    color: var(--bs-muted);
    text-decoration: none;
    border-inline-start: 2px solid var(--bs-border);
    line-height: 1.35;
  }

  .bs-toc-link:hover {
    color: var(--bs-text);
    background: var(--bs-elevated);
    border-inline-start-color: var(--bs-primary);
  }

  /* Hero Showcase Stage */
  .bs-hero {
    margin-block: 1.5rem 1.5rem;
    padding: clamp(1.35rem, 3vw, 2.25rem);
    border-radius: var(--bs-radius-l);
    background-color: var(--bs-surface);
    background-image: var(--bs-hero-glow);
    border: 1px solid var(--bs-border);
    box-shadow: var(--bs-shadow);
    box-sizing: border-box;
  }

  .bs-badge-strip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-block-end: 0.85rem;
  }

  .bs-title {
    margin: 0 0 0.55rem;
    font-size: clamp(1.6rem, 3vw, 2.38rem);
    line-height: 1.18;
    letter-spacing: -0.015em;
  }

  .bs-subtitle {
    margin: 0 0 1.1rem;
    font-size: 1.06rem;
    color: var(--bs-muted);
    max-inline-size: 78ch;
  }

  .bs-action-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-block-start: 0.95rem;
  }

  /* Featured Scenes Showcase (<wa-carousel>) */
  .bs-carousel-section {
    margin-block-end: 2rem;
  }

  .bs-scene-carousel {
    --aspect-ratio: 16 / 9;
    border-radius: var(--bs-radius-l);
  }

  .bs-slide-frame {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    border-radius: var(--bs-radius-l);
    overflow: hidden;
    border: 1px solid var(--bs-border);
    background: #070b14;
    margin: 0;
  }

  .bs-slide-img {
    inline-size: 100%;
    block-size: 100%;
    max-block-size: 480px;
    object-fit: cover;
    display: block;
  }

  .bs-slide-overlay {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    padding: clamp(1rem, 2.5vw, 1.65rem);
    background: linear-gradient(to top, rgba(7, 11, 20, 0.94) 0%, rgba(7, 11, 20, 0.72) 58%, transparent 100%);
    color: #f8fafc;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .bs-slide-copy {
    max-inline-size: 66ch;
  }

  .bs-slide-kicker {
    display: inline-block;
    font-size: 0.76rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #fbbf24;
    margin-block-end: 0.2rem;
  }

  .bs-slide-title {
    margin: 0 0 0.25rem;
    font-size: clamp(1.1rem, 2vw, 1.45rem);
    line-height: 1.25;
    color: #ffffff;
  }

  .bs-slide-desc {
    margin: 0;
    font-size: 0.92rem;
    color: #e2e8f0;
  }

  /* Dossier Hero Artwork & Inline Markdown Figures */
  .bs-dossier-hero {
    margin: 0 0 1.5rem;
    border-radius: var(--bs-radius-l);
    overflow: hidden;
    border: 1px solid var(--bs-border);
    background: var(--bs-surface);
    box-shadow: var(--bs-shadow);
  }

  .bs-dossier-hero-img {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 1408 / 768;
    object-fit: cover;
    display: block;
  }

  .bs-dossier-hero-caption,
  .bs-inline-caption {
    padding: 0.75rem 1.15rem;
    font-size: 0.88rem;
    color: var(--bs-muted);
    background: var(--bs-elevated);
    border-block-start: 1px solid var(--bs-border);
  }

  .bs-inline-figure {
    margin: 1.65rem 0;
    border-radius: var(--bs-radius-m);
    overflow: hidden;
    border: 1px solid var(--bs-border);
    background: var(--bs-surface);
  }

  .bs-inline-img {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 1408 / 768;
    object-fit: cover;
    display: block;
  }

  /* Search Stage */
  .bs-search-box {
    margin-block-start: 1.35rem;
    padding-block-start: 1.15rem;
    border-block-start: 1px solid var(--bs-border);
  }

  .bs-search-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block-end: 0.5rem;
  }

  .bs-search-label {
    font-weight: 800;
    font-size: 0.96rem;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .bs-search-count {
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--bs-muted);
  }

  .bs-chip-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    margin-block-start: 0.65rem;
  }

  .bs-chip-caption {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--bs-muted);
  }

  /* Archive Pulse Metric + Sparkline Strip */
  .bs-pulse-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
    gap: 1rem;
    margin-block-end: 1.85rem;
  }

  .bs-pulse-card {
    --spacing: 1.05rem;
  }

  .bs-pulse-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.65rem;
    margin-block-end: 0.55rem;
  }

  .bs-pulse-value {
    display: block;
    font-size: 1.68rem;
    font-weight: 900;
    line-height: 1.12;
  }

  .bs-pulse-title {
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--bs-muted);
  }

  .bs-pulse-caption {
    margin: 0.45rem 0 0;
    font-size: 0.85rem;
    color: var(--bs-muted);
  }

  /* Story Timeline & Collection Charts */
  .bs-charts-section {
    margin-block-end: 2rem;
  }

  .bs-section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-block-end: 0.9rem;
  }

  .bs-section-title {
    margin: 0;
    font-size: 1.38rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bs-section-lead {
    margin: 0;
    color: var(--bs-muted);
    font-size: 0.95rem;
  }

  .bs-charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.25rem;
    margin-block-end: 0.9rem;
  }

  .bs-chart-figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .bs-chart-caption {
    font-size: 0.88rem;
    color: var(--bs-muted);
  }

  .bs-data-table {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    margin-block-start: 0.5rem;
  }

  .bs-data-table caption {
    text-align: start;
    font-weight: 800;
    margin-block-end: 0.5rem;
  }

  .bs-data-table th,
  .bs-data-table td {
    padding: 0.55rem 0.75rem;
    border-block-end: 1px solid var(--bs-border);
    text-align: start;
  }

  .bs-data-table th {
    background: var(--bs-elevated);
    font-weight: 800;
  }

  /* Collection Cards Grid */
  .bs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
    margin-block: 1.15rem 2rem;
  }

  .bs-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  .bs-card::part(body) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.85rem;
    flex: 1;
  }

  .bs-card-media-img {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 1408 / 768;
    object-fit: cover;
    display: block;
  }

  .bs-card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    flex-wrap: wrap;
    margin-block-end: 0.55rem;
  }

  .bs-card-title {
    margin: 0.3rem 0 0.35rem;
    font-size: 1.14rem;
    line-height: 1.35;
  }

  .bs-card-subtitle {
    font-size: 0.87rem;
    font-weight: 700;
    margin-block-end: 0.45rem;
    color: var(--bs-text);
  }

  .bs-card-summary {
    margin: 0;
    color: var(--bs-muted);
    font-size: 0.93rem;
  }

  .bs-card-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-block-start: 0.35rem;
  }

  /* Interactive Ledger (<wa-data-grid>) & Tree Explorer (<wa-tree>) */
  .bs-ledger-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-block: 0.75rem 1rem;
  }

  .bs-grid-detail {
    padding: 0.9rem 1.1rem;
    background: var(--bs-elevated);
    border-radius: var(--bs-radius-m);
    border: 1px solid var(--bs-border);
  }

  .bs-grid-detail p {
    margin: 0 0 0.65rem;
    color: var(--bs-muted);
  }

  .bs-explorer-split {
    display: grid;
    grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
    gap: 1.25rem;
    align-items: start;
    margin-block: 1rem 2rem;
  }

  @media (max-width: 860px) {
    .bs-explorer-split {
      grid-template-columns: 1fr;
    }
  }

  .bs-tree-pane {
    max-block-size: 32rem;
    overflow-y: auto;
  }

  /* Dossier Metadata & Article Prose */
  .bs-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.75rem;
    margin-block-start: 1.25rem;
    padding-block-start: 1.1rem;
    border-block-start: 1px solid var(--bs-border);
    font-size: 0.9rem;
  }

  .bs-meta-item {
    background: var(--bs-elevated);
    padding: 0.65rem 0.9rem;
    border-radius: var(--bs-radius-m);
    border: 1px solid var(--bs-border);
  }

  .bs-meta-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.74rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--bs-muted);
    margin-block-end: 0.15rem;
  }

  .bs-article-card {
    display: block;
    margin-block-end: 2rem;
  }

  .bs-article-prose {
    font-size: 1.03rem;
    line-height: 1.78;
  }

  .bs-heading {
    line-height: 1.3;
    margin-block: 1.65rem 0.65rem;
    scroll-margin-block-start: 5.5rem;
  }

  .bs-article-prose > .bs-heading:first-child {
    margin-block-start: 0.25rem;
  }

  .bs-email-card {
    margin-block: 1.5rem;
    border: 1px solid var(--bs-email-border);
    border-inline-start: 5px solid var(--bs-primary);
    border-radius: 0.75rem;
    background: var(--bs-email-bg);
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .bs-email-card-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.6rem 1.1rem;
    background: var(--bs-email-bar);
    border-block-end: 1px solid var(--bs-email-border);
    font-size: 0.8rem;
    font-weight: 800;
  }

  .bs-email-card-seal {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    letter-spacing: 0.07em;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    background: var(--bs-fallback-primary);
    color: var(--bs-fallback-primary-fg);
  }

  .bs-email-card-body {
    padding: 1.15rem 1.35rem;
  }

  .bs-email-card-body p:first-child {
    margin-block-start: 0;
  }

  .bs-email-card-body p:last-child {
    margin-block-end: 0;
  }

  .bs-blockquote {
    margin-block: 1.25rem;
    margin-inline: 0;
    padding: 0.85rem 1.25rem;
    border-inline-start: 4px solid var(--bs-primary);
    background: var(--bs-elevated);
    border-radius: 0 var(--bs-radius-m) var(--bs-radius-m) 0;
  }

  .bs-code-block {
    padding: 1rem 1.15rem;
    border-radius: var(--bs-radius-m);
    background: var(--bs-elevated);
    border: 1px solid var(--bs-border);
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.88rem;
    line-height: 1.55;
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
    border-block-start: 1px solid var(--bs-border);
    margin-block: 2rem;
  }

  .bs-list {
    padding-inline-start: 1.35rem;
  }

  .bs-list li:not(:last-child) {
    margin-block-end: 0.65rem;
  }

  .bs-list-subline {
    margin-block-start: 0.25rem;
    color: var(--bs-muted);
    font-size: 0.95em;
  }

  /* Related Scroller Strip */
  .bs-scroller-track {
    display: flex;
    gap: 1rem;
    padding-block: 0.35rem 0.65rem;
  }

  .bs-scroller-card {
    min-inline-size: 300px;
    max-inline-size: 340px;
    flex: 0 0 auto;
  }

  /* Share QR Popover & Copy Pill */
  .bs-copy-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border-radius: var(--bs-radius-m);
    background: var(--bs-elevated);
    border: 1px solid var(--bs-border);
    font-size: 0.85rem;
    font-weight: 700;
  }

  .bs-qr-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.55rem;
    text-align: center;
    max-inline-size: 210px;
  }

  .bs-qr-caption {
    margin: 0;
    font-size: 0.82rem;
    color: var(--bs-muted);
  }

  /* Appearance Drawer Studio & Install Dialog */
  .bs-studio-stack {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .bs-studio-note {
    margin: 0;
    font-size: 0.9rem;
    color: var(--bs-muted);
  }

  .bs-install-steps {
    display: grid;
    gap: 0.85rem;
    margin-block: 0.5rem;
  }

  /* Quick View Dialog */
  .bs-dialog-width {
    --width: 54rem;
  }

  .bs-dialog-meta {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    margin-block-end: 1rem;
    padding-block-end: 0.75rem;
    border-block-end: 1px solid var(--bs-border);
  }

  .bs-skeleton-stack {
    display: grid;
    gap: 0.75rem;
    padding-block: 0.5rem;
  }

  /* Footer & Mandatory Fictitious Disclaimer */
  .bs-footer {
    inline-size: 100%;
    padding-block: 2.25rem;
    background: var(--bs-surface);
    border-block-start: 1px solid var(--bs-border);
    font-size: 0.9rem;
  }

  .bs-disclaimer {
    padding: 1.15rem 1.3rem;
    border-radius: 0.75rem;
    background: var(--bs-elevated);
    border: 1px solid var(--bs-border);
    margin-block-end: 1.15rem;
    color: var(--bs-muted);
  }

  .bs-footer-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.85rem;
  }

  .bs-footer-links {
    display: flex;
    gap: 1.1rem;
    flex-wrap: wrap;
  }
}
`;
}

/**
 * Generates `/assets/backstage-client.js` powering:
 * 1. Reading Appearance & Theme Studio (`<wa-drawer>`, 3-state color-scheme
 *    synchronization without clobbering pinned user choices on OS time-of-day
 *    shifts, cross-tab `storage` sync, and live Web Awesome Pro theme + palette switching).
 * 2. One-Click Install App controller (`beforeinstallprompt` on Desktop/Android
 *    plus friendly Add-to-Home-Screen `<wa-dialog>` on iOS/iPadOS Safari).
 * 3. Header `<wa-dropdown>` quick navigation.
 * 4. Instant debounced `<wa-input>` search + quick-topic filter chips.
 * 5. Interactive `<wa-data-grid>` Archival Ledger configuration (`columns`, `data`,
 *    `rowDetail`, `groupBy`, `sizeColumnsToFit()`, `resetState()`, `exportDataAsCsv()`).
 * 6. Hierarchical `<wa-tree>` Folder Explorer inspector.
 * 7. `<wa-dialog>` Quick View modal with `<wa-skeleton>` loading shimmer.
 * 8. Offline-capable PWA Service Worker registration (`/sw.js`).
 * @returns {string}
 */
function buildBackstageClientJs() {
  return `/**
 * @license MIT
 * ============================================================================
 * /assets/backstage-client.js — RaggieSoft Backstage Progressive Controller
 * ============================================================================
 * Orchestrates Web Awesome Pro 3.13.0 interactive components, the Reading
 * Appearance Studio (themes, palettes, and 3-state lighting), Install App
 * progressive prompts, debounced search live-region announcements, the
 * Archival Ledger data grid, Folder Explorer, and Quick View modal.
 * ============================================================================
 */
(function () {
  var VALID_THEMES = ['default', 'awesome', 'glossy', 'mellow', 'premium'];
  var VALID_PALETTES = ['default', 'elegant', 'natural', 'vogue'];

  var metaScheme = document.querySelector('meta[name="color-scheme"]');
  var mqlDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  var appearanceBtn = document.getElementById('bs-open-appearance');
  var appearanceDrawer = document.getElementById('bs-appearance-drawer');
  var closeAppearanceBtn = document.getElementById('bs-close-appearance');
  var resetAppearanceBtn = document.getElementById('bs-reset-appearance');
  var schemeRadios = document.getElementById('bs-scheme-radios');
  var themeRadios = document.getElementById('bs-theme-radios');
  var paletteRadios = document.getElementById('bs-palette-radios');
  var systemHint = document.getElementById('bs-system-hint');

  function safeGetStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSetStorage(key, val) {
    try {
      if (val === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, val);
      }
    } catch (e) {}
  }

  function getSystemScheme() {
    return mqlDark && mqlDark.matches ? 'dark' : 'light';
  }

  function getStoredSchemeMode() {
    var s = safeGetStorage('color-scheme');
    return s === 'light' || s === 'dark' ? s : 'system';
  }

  function getStoredTheme() {
    var t = safeGetStorage('bs-wa-theme');
    return VALID_THEMES.indexOf(t) !== -1 ? t : 'default';
  }

  function getStoredPalette() {
    var p = safeGetStorage('bs-wa-palette');
    return VALID_PALETTES.indexOf(p) !== -1 ? p : 'default';
  }

  /**
   * Applies the active lighting scheme, Web Awesome Pro theme, and color palette
   * to <html> and <meta name="color-scheme"> without touching stored values when
   * reacting to OS preference changes.
   */
  function syncAppearanceDom(modeOverride, themeOverride, paletteOverride) {
    var mode = modeOverride || getStoredSchemeMode();
    var theme = themeOverride || getStoredTheme();
    var palette = paletteOverride || getStoredPalette();
    var sys = getSystemScheme();
    var resolved = mode === 'system' ? sys : mode;

    if (metaScheme) {
      metaScheme.content = mode === 'system' ? 'light dark' : mode;
    }

    var root = document.documentElement;
    root.className =
      'wa-theme-' + theme + ' wa-palette-' + palette + (resolved === 'dark' ? ' wa-dark' : '');
    root.setAttribute('data-theme', resolved);

    if (systemHint) {
      systemHint.textContent = sys === 'dark' ? '(Currently Dark)' : '(Currently Light)';
    }
    if (schemeRadios && schemeRadios.value !== mode) {
      schemeRadios.value = mode;
    }
    if (themeRadios && themeRadios.value !== theme) {
      themeRadios.value = theme;
    }
    if (paletteRadios && paletteRadios.value !== palette) {
      paletteRadios.value = palette;
    }
  }

  syncAppearanceDom();

  // React to OS dark/light shifts ONLY when in system mode — never clear a pinned choice
  if (mqlDark && typeof mqlDark.addEventListener === 'function') {
    mqlDark.addEventListener('change', function () {
      syncAppearanceDom();
    });
  }

  // Keep open tabs synchronized when appearance preferences change elsewhere
  window.addEventListener('storage', function (e) {
    if (!e.key || e.key === 'color-scheme' || e.key === 'bs-wa-theme' || e.key === 'bs-wa-palette') {
      syncAppearanceDom();
    }
  });

  if (appearanceBtn && appearanceDrawer) {
    appearanceBtn.addEventListener('click', function () {
      syncAppearanceDom();
      appearanceDrawer.open = true;
    });
  }

  if (closeAppearanceBtn && appearanceDrawer) {
    closeAppearanceBtn.addEventListener('click', function () {
      appearanceDrawer.open = false;
    });
  }

  if (schemeRadios) {
    schemeRadios.addEventListener('change', function () {
      var val = schemeRadios.value;
      if (val === 'light' || val === 'dark') {
        safeSetStorage('color-scheme', val);
        syncAppearanceDom(val, null, null);
      } else {
        safeSetStorage('color-scheme', null);
        syncAppearanceDom('system', null, null);
      }
    });
  }

  if (themeRadios) {
    themeRadios.addEventListener('change', function () {
      var val = VALID_THEMES.indexOf(themeRadios.value) !== -1 ? themeRadios.value : 'default';
      safeSetStorage('bs-wa-theme', val === 'default' ? null : val);
      syncAppearanceDom(null, val, null);
    });
  }

  if (paletteRadios) {
    paletteRadios.addEventListener('change', function () {
      var val = VALID_PALETTES.indexOf(paletteRadios.value) !== -1 ? paletteRadios.value : 'default';
      safeSetStorage('bs-wa-palette', val === 'default' ? null : val);
      syncAppearanceDom(null, null, val);
    });
  }

  if (resetAppearanceBtn) {
    resetAppearanceBtn.addEventListener('click', function () {
      safeSetStorage('color-scheme', null);
      safeSetStorage('bs-wa-theme', null);
      safeSetStorage('bs-wa-palette', null);
      syncAppearanceDom('system', 'default', 'default');
    });
  }

  // Install App Controller (Desktop/Android beforeinstallprompt + iOS/iPadOS Home Screen guide)
  var installBtn = document.getElementById('bs-install-app');
  var iosInstallDialog = document.getElementById('bs-ios-install-dialog');
  var closeIosInstallBtn = document.getElementById('bs-close-ios-install');
  var deferredInstallPrompt = null;

  var isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;

  var ua = window.navigator.userAgent || '';
  var isIosSafari =
    (/iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) &&
    !/CriOS|FxiOS|EdgiOS/.test(ua);

  if (!isStandalone && installBtn) {
    if (isIosSafari) {
      installBtn.hidden = false;
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredInstallPrompt = e;
      installBtn.hidden = false;
    });

    window.addEventListener('appinstalled', function () {
      deferredInstallPrompt = null;
      installBtn.hidden = true;
    });

    installBtn.addEventListener('click', function () {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.finally(function () {
          deferredInstallPrompt = null;
        });
      } else if (iosInstallDialog) {
        iosInstallDialog.open = true;
      }
    });
  }

  if (closeIosInstallBtn && iosInstallDialog) {
    closeIosInstallBtn.addEventListener('click', function () {
      iosInstallDialog.open = false;
    });
  }

  // Header Collections <wa-dropdown> navigation
  var navDropdown = document.getElementById('bs-collections-dropdown');
  if (navDropdown) {
    navDropdown.addEventListener('wa-select', function (e) {
      var item = e.detail && e.detail.item;
      var href = item && item.value;
      if (href) {
        window.location.href = href;
      }
    });
  }

  // Instant Search Filtering + Debounced Polite Live-Region Announcements
  var searchInput = document.getElementById('backstage-search');
  var searchCount = document.getElementById('backstage-search-count');
  var mainTabGroup = document.getElementById('bs-main-tabs');
  var announceTimer = null;

  if (searchInput) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-bs-card]'));
    var runFilter = function (switchToAllTab) {
      var q = String(searchInput.value || '').toLowerCase().trim();
      var visible = 0;
      cards.forEach(function (card) {
        var hay = (card.getAttribute('data-bs-search') || '').toLowerCase();
        var match = !q || hay.indexOf(q) !== -1;
        card.hidden = !match;
        card.style.display = match ? '' : 'none';
        if (match && card.getAttribute('data-bs-primary-card') === 'true') {
          visible++;
        }
      });

      if (q && switchToAllTab && mainTabGroup && typeof mainTabGroup.show === 'function') {
        mainTabGroup.show('all');
      }

      if (searchCount) {
        clearTimeout(announceTimer);
        announceTimer = setTimeout(function () {
          searchCount.textContent = q
            ? visible + (visible === 1 ? ' matching record' : ' matching records')
            : 'Showing all ' + visible + ' records';
        }, 220);
      }
    };

    searchInput.addEventListener('input', function () {
      runFilter(true);
    });
    searchInput.addEventListener('wa-clear', function () {
      searchInput.value = '';
      runFilter(false);
    });

    document.addEventListener('click', function (e) {
      var chip = e.target.closest && e.target.closest('[data-bs-filter-term]');
      if (!chip) return;
      var term = chip.getAttribute('data-bs-filter-term') || '';
      searchInput.value = term;
      runFilter(true);
      if (typeof searchInput.focus === 'function') {
        searchInput.focus();
      }
    });
  }

  // Parse embedded archive dataset for <wa-data-grid> Ledger & <wa-tree> Explorer
  var archiveDataEl = document.getElementById('bs-archive-dataset');
  var archiveRows = [];
  if (archiveDataEl) {
    try {
      archiveRows = JSON.parse(archiveDataEl.textContent || '[]');
    } catch (e) {
      archiveRows = [];
    }
  }

  var archiveBySlug = {};
  archiveRows.forEach(function (r) {
    archiveBySlug[r.slug] = r;
  });

  // Configure <wa-data-grid> Interactive Archival Ledger
  var ledgerGrid = document.getElementById('bs-ledger-grid');
  if (ledgerGrid && archiveRows.length > 0) {
    var initLedger = function () {
      ledgerGrid.columns = [
        {
          id: 'date',
          field: 'date',
          header: 'Story Date',
          label: 'Story Date',
          sortable: true,
          width: 135,
          minWidth: 115
        },
        {
          id: 'title',
          field: 'title',
          header: 'Dossier / Dispatch Title',
          label: 'Dossier / Dispatch Title',
          sortable: true,
          minWidth: 260
        },
        {
          id: 'collection',
          field: 'collection',
          header: 'Collection',
          label: 'Collection',
          sortable: true,
          filterable: true,
          width: 230,
          minWidth: 170
        },
        {
          id: 'origin',
          field: 'origin',
          header: 'In-Universe Source / Location',
          label: 'In-Universe Source / Location',
          sortable: true,
          minWidth: 220
        }
      ];

      ledgerGrid.rowDetail = function (row) {
        var wrap = document.createElement('div');
        wrap.className = 'bs-grid-detail';

        var summaryP = document.createElement('p');
        summaryP.textContent = row.summary || '';
        wrap.appendChild(summaryP);

        var actions = document.createElement('div');
        actions.className = 'bs-card-actions';

        var openBtn = document.createElement('wa-button');
        openBtn.setAttribute('variant', 'brand');
        openBtn.setAttribute('size', 'small');
        openBtn.setAttribute('href', row.routePath);
        openBtn.textContent = 'Open Full Dossier';
        actions.appendChild(openBtn);

        var quickBtn = document.createElement('wa-button');
        quickBtn.setAttribute('variant', 'neutral');
        quickBtn.setAttribute('appearance', 'outlined');
        quickBtn.setAttribute('size', 'small');
        quickBtn.setAttribute('data-bs-preview-slug', row.slug);
        quickBtn.textContent = 'Quick View';
        actions.appendChild(quickBtn);

        wrap.appendChild(actions);
        return wrap;
      };

      ledgerGrid.data = archiveRows;
    };

    if (window.customElements && window.customElements.whenDefined) {
      window.customElements.whenDefined('wa-data-grid').then(initLedger).catch(initLedger);
    } else {
      initLedger();
    }

    var groupToggleBtn = document.getElementById('bs-ledger-group');
    var fitColsBtn = document.getElementById('bs-ledger-fit');
    var resetLedgerBtn = document.getElementById('bs-ledger-reset');
    var exportCsvBtn = document.getElementById('bs-ledger-csv');

    if (groupToggleBtn) {
      groupToggleBtn.addEventListener('click', function () {
        var grouped = Boolean(ledgerGrid.groupBy);
        ledgerGrid.groupBy = grouped ? null : 'collection';
        groupToggleBtn.setAttribute('appearance', grouped ? 'outlined' : 'accent');
      });
    }
    if (fitColsBtn) {
      fitColsBtn.addEventListener('click', function () {
        if (typeof ledgerGrid.sizeColumnsToFit === 'function') {
          ledgerGrid.sizeColumnsToFit();
        }
      });
    }
    if (resetLedgerBtn) {
      resetLedgerBtn.addEventListener('click', function () {
        ledgerGrid.groupBy = null;
        if (groupToggleBtn) groupToggleBtn.setAttribute('appearance', 'outlined');
        if (typeof ledgerGrid.resetState === 'function') {
          ledgerGrid.resetState();
        }
      });
    }
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', function () {
        if (typeof ledgerGrid.exportDataAsCsv === 'function') {
          ledgerGrid.exportDataAsCsv({
            fileName: 'raggiesoft-backstage-archive.csv',
            includeHeaders: true,
            escapeFormulas: true
          });
        }
      });
    }
  }

  // Configure <wa-tree> Folder Explorer Inspector
  var archiveTree = document.getElementById('bs-archive-tree');
  var treeTitle = document.getElementById('bs-tree-title');
  var treeCollection = document.getElementById('bs-tree-collection');
  var treeDate = document.getElementById('bs-tree-date');
  var treeOrigin = document.getElementById('bs-tree-origin');
  var treeSummary = document.getElementById('bs-tree-summary');
  var treeOpenBtn = document.getElementById('bs-tree-open');
  var treeQuickBtn = document.getElementById('bs-tree-quick');

  function updateTreeInspector(slug) {
    var rec = archiveBySlug[slug];
    if (!rec || !treeTitle) return;
    treeTitle.textContent = rec.title;
    if (treeCollection) treeCollection.textContent = rec.collection;
    if (treeDate) treeDate.textContent = rec.date || 'Archival Record';
    if (treeOrigin) {
      treeOrigin.textContent = rec.origin ? 'Source / Setting: ' + rec.origin : '';
    }
    if (treeSummary) treeSummary.textContent = rec.summary;
    if (treeOpenBtn) treeOpenBtn.setAttribute('href', rec.routePath);
    if (treeQuickBtn) treeQuickBtn.setAttribute('data-bs-preview-slug', rec.slug);
  }

  if (archiveTree) {
    archiveTree.addEventListener('wa-selection-change', function (e) {
      var sel = e.detail && e.detail.selection && e.detail.selection[0];
      if (!sel) return;
      var slug = sel.getAttribute('data-slug');
      if (slug) updateTreeInspector(slug);
    });
  }

  // Quick-Preview <wa-dialog> Modal
  var previewDialog = document.getElementById('bs-preview-dialog');
  var previewMeta = document.getElementById('bs-preview-meta');
  var previewBody = document.getElementById('bs-preview-body');
  var previewFullLink = document.getElementById('bs-preview-full-link');
  var previewCopyBtn = document.getElementById('bs-preview-copy');
  var previewClose = document.getElementById('bs-preview-close');

  if (previewDialog && previewClose) {
    previewClose.addEventListener('click', function () {
      previewDialog.open = false;
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-bs-preview-slug]');
    if (!btn || !previewDialog) return;
    e.preventDefault();
    var slug = btn.getAttribute('data-bs-preview-slug');
    if (!slug) return;

    previewDialog.label = 'Loading Backstage Dossier…';
    if (previewMeta) previewMeta.innerHTML = '';
    if (previewBody) {
      previewBody.innerHTML =
        '<div class="bs-skeleton-stack" aria-busy="true">' +
        '<wa-skeleton effect="sheen"></wa-skeleton>' +
        '<wa-skeleton effect="sheen"></wa-skeleton>' +
        '<wa-skeleton effect="sheen"></wa-skeleton>' +
        '</div>';
    }
    if (previewFullLink) previewFullLink.setAttribute('href', '/' + slug);
    if (previewCopyBtn) {
      previewCopyBtn.setAttribute('value', 'https://backstage.raggiesoft.com/' + slug);
    }

    previewDialog.open = true;

    fetch('/api/v1/' + slug + '.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load dossier');
        return r.json();
      })
      .then(function (data) {
        previewDialog.label = data.title || 'Backstage Dossier';
        if (previewMeta) {
          previewMeta.innerHTML = '';
          var addPill = function (text, variant) {
            if (!text) return;
            var badge = document.createElement('wa-badge');
            badge.setAttribute('variant', variant || 'neutral');
            badge.setAttribute('appearance', 'filled-outlined');
            badge.setAttribute('pill', '');
            badge.textContent = text;
            previewMeta.appendChild(badge);
          };
          addPill(data.category, 'brand');
          if (data.date) addPill(data.date + (data.time ? ' • ' + data.time : ''), 'neutral');
          if (data.sender) addPill('From: ' + data.sender, 'neutral');
          if (data.location) addPill(data.location, 'neutral');
        }
        if (previewBody) {
          var heroHtml = '';
          if (data.image) {
            var safeSrc = String(data.image).replace(/"/g, '&quot;');
            var safeAlt = String(data.imageAlt || data.title || '').replace(/"/g, '&quot;');
            heroHtml =
              '<figure class="bs-inline-figure" style="margin-block-start:0">' +
              '<img src="' + safeSrc + '" alt="' + safeAlt + '" width="1408" height="768" loading="lazy" class="bs-inline-img" />' +
              '</figure>';
          }
          previewBody.innerHTML = heroHtml + '<div class="bs-article-prose">' + (data.html || '') + '</div>';
        }
        if (previewFullLink && data.slug) {
          previewFullLink.setAttribute('href', '/' + data.slug);
        }
        if (previewCopyBtn && data.canonicalUrl) {
          previewCopyBtn.setAttribute('value', data.canonicalUrl);
        }
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
 * Renders the 92 Light & Dark iOS/iPadOS `<link rel="apple-touch-startup-image">` tags.
 * @returns {string}
 */
function renderIosSplashLinksHtml() {
  const lines = [];
  for (const s of IOS_SPLASH_SPECS) {
    lines.push(
      `    <link rel="apple-touch-startup-image" href="${PWA_CDN_BASE}/apple-splash-${s.pw}-${s.ph}.jpg?v=${ASSET_VERSION}" media="(device-width: ${s.dw}px) and (device-height: ${s.dh}px) and (-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: portrait)" />`,
      `    <link rel="apple-touch-startup-image" href="${PWA_CDN_BASE}/apple-splash-${s.ph}-${s.pw}.jpg?v=${ASSET_VERSION}" media="(device-width: ${s.dw}px) and (device-height: ${s.dh}px) and (-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: landscape)" />`,
      `    <link rel="apple-touch-startup-image" href="${PWA_CDN_BASE}/apple-splash-dark-${s.pw}-${s.ph}.jpg?v=${ASSET_VERSION}" media="(prefers-color-scheme: dark) and (device-width: ${s.dw}px) and (device-height: ${s.dh}px) and (-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: portrait)" />`,
      `    <link rel="apple-touch-startup-image" href="${PWA_CDN_BASE}/apple-splash-dark-${s.ph}-${s.pw}.jpg?v=${ASSET_VERSION}" media="(prefers-color-scheme: dark) and (device-width: ${s.dw}px) and (device-height: ${s.dh}px) and (-webkit-device-pixel-ratio: ${s.dpr}) and (orientation: landscape)" />`
    );
  }
  return lines.join('\n');
}

/**
 * Renders a reusable `<wa-card>` dossier preview card with Web Awesome Pro
 * media slots, badges, tags, disambiguated accessible names, and Font Awesome Pro+ icons.
 * @param {Record<string, any>} item
 * @param {boolean} isPrimary
 * @returns {string}
 */
function renderDossierCard(item, isPrimary = false) {
  const col = describeCollection(item);
  const searchHaystack = [
    item.title,
    item.subtitle,
    item.category,
    item.sender,
    item.recipient,
    item.subject,
    item.location,
    item.summary,
    item.date
  ]
    .filter(Boolean)
    .join(' ');

  const hasMedia = Boolean(item.image);
  const mediaSlotHtml = hasMedia
    ? `<img slot="media" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}" width="704" height="384" loading="lazy" class="bs-card-media-img" />`
    : '';

  return `
    <wa-card${hasMedia ? ' with-media' : ''} class="bs-card" data-bs-card data-bs-primary-card="${isPrimary ? 'true' : 'false'}" data-bs-search="${escapeHtml(searchHaystack)}">
      ${mediaSlotHtml}
      <div>
        <div class="bs-card-meta">
          <wa-badge variant="${col.badgeVariant}" appearance="filled-outlined" pill>
            <wa-icon family="${col.iconFamily}" name="${col.iconName}" swap-opacity aria-hidden="true"></wa-icon>&nbsp;${escapeHtml(col.label)}
          </wa-badge>
          ${
            item.date
              ? `<wa-tag size="small" pill><wa-icon family="classic" variant="regular" name="calendar" aria-hidden="true"></wa-icon>&nbsp;${escapeHtml(item.date)}</wa-tag>`
              : ''
          }
        </div>
        <h3 class="bs-card-title"><a href="${item.routePath}" class="bs-link">${escapeHtml(item.title)}</a></h3>
        ${item.subtitle ? `<div class="bs-card-subtitle">${escapeHtml(item.subtitle)}</div>` : ''}
        <p class="bs-card-summary">${escapeHtml(item.summary)}</p>
      </div>
      <div class="bs-card-actions">
        <wa-button variant="brand" size="small" href="${item.routePath}">
          <wa-icon slot="start" family="duotone" name="folder-open" swap-opacity aria-hidden="true"></wa-icon>
          Open Dossier<span class="visually-hidden">: ${escapeHtml(item.title)}</span>
        </wa-button>
        <wa-button variant="neutral" appearance="outlined" size="small" data-bs-preview-slug="${escapeHtml(item.slug)}">
          <wa-icon slot="start" family="duotone" name="expand" swap-opacity aria-hidden="true"></wa-icon>
          Quick View<span class="visually-hidden">: ${escapeHtml(item.title)}</span>
        </wa-button>
      </div>
    </wa-card>
  `;
}

/**
 * Generates the Web Awesome Pro 3.13.0 `<wa-page>` + Font Awesome Pro+ outer HTML5 document shell.
 */
function renderBackstageShell({
  title,
  description,
  canonicalPath = '/',
  ogImage = `${OG_CDN_BASE}/backstage-hub-og.jpg`,
  ogImageAlt = 'RaggieSoft Backstage — Behind-the-scenes dossiers, alternate points of view, and campus guides across RaggieSoft Books and Music.',
  noindex = false,
  counts = {
    rachel: 11,
    rachelDossiers: 10,
    katie: 16,
    katieDossiers: 15,
    aubrie: 13,
    aubrieDossiers: 12,
    lore: 3,
    total: 43
  },
  subheaderHtml = '',
  asideHtml = '',
  bodyHtml
}) {
  const safeTitle = escapeHtml(clampMetaText(title, 60));
  const safeDesc = escapeHtml(clampMetaText(description, 155));
  const safeOgAlt = escapeHtml(clampMetaText(ogImageAlt || title, 180));
  const isErrorPage = canonicalPath === '/404';
  const canonicalUrl = `https://backstage.raggiesoft.com${canonicalPath === '/' ? '' : canonicalPath}`;
  const robotsMetaHtml = noindex ? '\n    <meta name="robots" content="noindex, follow" />' : '';
  const canonicalLinkHtml = isErrorPage ? '' : `\n    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`;

  const navItems = [
    { href: '/', label: 'Hub', icon: 'clapperboard-play' },
    { href: '/books/rachel', label: `Rachel (${counts.rachelDossiers})`, icon: 'shield-heart' },
    { href: '/books/katie', label: `Katie & Nathaniel (${counts.katieDossiers})`, icon: 'wheelchair-move' },
    { href: '/books/aubrie', label: `Eleventh Child (${counts.aubrieDossiers})`, icon: 'book-sparkles' }
  ];

  const navHtml = navItems
    .map((item) => {
      const isCurrent =
        item.href === canonicalPath || (item.href !== '/' && canonicalPath.startsWith(`${item.href}/`));
      return `<li><a href="${item.href}" class="bs-nav-link"${
        isCurrent ? ' aria-current="page"' : ''
      }><wa-icon family="duotone" name="${item.icon}" swap-opacity aria-hidden="true"></wa-icon><span>${escapeHtml(item.label)}</span></a></li>`;
    })
    .join('\n                ');

  const splashLinksHtml = renderIosSplashLinksHtml();

  return `<!DOCTYPE html>
<html lang="en" class="wa-theme-default wa-palette-default" data-fa-kit-code="${FA_PRO_KIT_CODE}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="color-scheme" content="light dark" />
    <script>
      try {
        var s = localStorage.getItem('color-scheme');
        var t = localStorage.getItem('bs-wa-theme') || 'default';
        var p = localStorage.getItem('bs-wa-palette') || 'default';
        var vt = ['default', 'awesome', 'glossy', 'mellow', 'premium'];
        var vp = ['default', 'elegant', 'natural', 'vogue'];
        if (vt.indexOf(t) === -1) t = 'default';
        if (vp.indexOf(p) === -1) p = 'default';
        document.querySelector('meta[name="color-scheme"]').content =
          (s === 'light' || s === 'dark') ? s : 'light dark';
        var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = (s === 'light' || s === 'dark') ? (s === 'dark') : sysDark;
        var root = document.documentElement;
        root.className = 'wa-theme-' + t + ' wa-palette-' + p + (isDark ? ' wa-dark' : '');
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } catch (e) {}
    </script>

    <!-- Resource Hints for Early TLS Handshakes -->
    <link rel="preconnect" href="https://assets.raggiesoft.com" crossorigin />
    <link rel="preconnect" href="https://ka-p.webawesome.com" crossorigin />
    <link rel="preconnect" href="https://kit.fontawesome.com" crossorigin />

    <!-- Progressive Web App Manifest, Adaptive Theme Colors, Icons & 92 iOS Splash Screens -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#070b14" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#861f41" media="(prefers-color-scheme: light)" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Backstage" />
    <link rel="icon" href="/favicon.ico?v=${ASSET_VERSION}" sizes="32x32" />
    <link rel="icon" type="image/svg+xml" href="/icons/icon.svg?v=${ASSET_VERSION}" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png?v=${ASSET_VERSION}" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180.png?v=${ASSET_VERSION}" />
${splashLinksHtml}

    <!-- Primary SEO & Complete 1200x630 OpenGraph / Twitter Card Metadata -->
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />${robotsMetaHtml}${canonicalLinkHtml}
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="${canonicalPath === '/' ? 'website' : 'article'}" />
    <meta property="og:site_name" content="RaggieSoft Backstage" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${safeOgAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:image:alt" content="${safeOgAlt}" />

    <script type="application/ld+json">${safeJsonForScript({
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
          name: 'RaggieSoft Backstage — Bonus Features & Story Companion Archive',
          publisher: { '@id': 'https://raggiesoft.com/#organization' }
        },
        {
          '@type': 'WebApplication',
          '@id': 'https://backstage.raggiesoft.com/#webapp',
          name: 'RaggieSoft Backstage',
          url: 'https://backstage.raggiesoft.com',
          applicationCategory: 'EntertainmentApplication',
          operatingSystem: 'Web, macOS, Windows, Linux, iOS, Android',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
        },
        {
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: clampMetaText(title, 60),
          description: clampMetaText(description, 155),
          isPartOf: { '@id': 'https://backstage.raggiesoft.com/#website' },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: ogImage,
            width: 1200,
            height: 630
          },
          license: 'https://creativecommons.org/licenses/by-sa/4.0/'
        }
      ]
    })}</script>

    <!-- Web Awesome Pro 3.13.0 Themes, Color Palettes, Utilities & Autoloader -->
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/themes/default.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/themes/awesome.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/themes/glossy.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/themes/mellow.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/themes/premium.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/color/palettes/default.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/color/palettes/elegant.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/color/palettes/natural.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/color/palettes/vogue.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/utilities.css" />
    <link rel="stylesheet" href="${WA_PRO_BASE}/styles/native.css" />
    <script type="module" src="${WA_PRO_BASE}/webawesome.loader.js"></script>

    <!-- Font Awesome Pro+ Kit (ec060982d4) -->
    <link rel="stylesheet" href="https://kit.fontawesome.com/${FA_PRO_KIT_CODE}.css" crossorigin="anonymous" />

    <link rel="stylesheet" href="/assets/backstage.css?v=${ASSET_VERSION}" />
    <link rel="stylesheet" href="https://assets.raggiesoft.com/common/css/raggiesoft-network.css?v=20261029f" />

    <!-- Google Analytics 4 (GA4) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-P9RG9JVYB6"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-P9RG9JVYB6');
    </script>
  </head>
  <body>
    <wa-page disable-navigation-toggle mobile-breakpoint="920" class="bs-page">
      <a href="#content" slot="skip-to-content" class="skip-link">Skip to Backstage main content</a>

      <nav slot="banner" class="rs-network-bar" aria-label="RaggieSoft Ecosystem">
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

      <div slot="header" class="bs-header">
        <div class="bs-container bs-header-inner">
          <a href="/" class="bs-brand">
            <img src="/icons/icon-192.png?v=${ASSET_VERSION}" alt="" width="29" height="29" class="bs-brand-icon" />
            <span><span class="bs-brand-prefix">RaggieSoft </span>Backstage</span>
          </a>

          <div class="bs-nav-row">
            <nav class="bs-desktop-nav" aria-label="Backstage collections">
              <ul class="bs-nav">
                ${navHtml}
              </ul>
            </nav>

            <wa-dropdown id="bs-collections-dropdown" placement="bottom-end">
              <wa-button slot="trigger" variant="neutral" appearance="outlined" size="small" with-caret>
                <wa-icon slot="start" family="duotone" name="compass" swap-opacity aria-hidden="true"></wa-icon>
                <span class="bs-dropdown-mobile-label">Browse</span><span class="bs-dropdown-desktop-label">More</span>
              </wa-button>
              <wa-dropdown-item value="/">
                <wa-icon slot="icon" family="duotone" name="clapperboard-play" aria-hidden="true"></wa-icon>
                Backstage Hub (${counts.total} Records)
              </wa-dropdown-item>
              <wa-dropdown-item value="/books/rachel">
                <wa-icon slot="icon" family="duotone" name="shield-heart" aria-hidden="true"></wa-icon>
                The Rachel Narrative (${counts.rachelDossiers} Dossiers)
              </wa-dropdown-item>
              <wa-dropdown-item value="/books/katie">
                <wa-icon slot="icon" family="duotone" name="wheelchair-move" aria-hidden="true"></wa-icon>
                Katie &amp; Nathaniel (${counts.katieDossiers} Dossiers)
              </wa-dropdown-item>
              <wa-dropdown-item value="/books/aubrie">
                <wa-icon slot="icon" family="duotone" name="book-sparkles" aria-hidden="true"></wa-icon>
                The Eleventh Child (${counts.aubrieDossiers} Files)
              </wa-dropdown-item>
              <wa-divider></wa-divider>
              <wa-dropdown-item value="/locations/cpi">
                <wa-icon slot="icon" family="duotone" name="building-columns" aria-hidden="true"></wa-icon>
                Commonwealth Polytechnic Institute (CPI)
              </wa-dropdown-item>
              <wa-dropdown-item value="/music/stardust-engine-origins">
                <wa-icon slot="icon" family="duotone" name="compact-disc" aria-hidden="true"></wa-icon>
                The Stardust Engine: 1986 Origins
              </wa-dropdown-item>
              <wa-dropdown-item value="/corporations/vectron-question-the-rules">
                <wa-icon slot="icon" family="duotone" name="scale-balanced" aria-hidden="true"></wa-icon>
                Vectron Energy Corp. Archive
              </wa-dropdown-item>
              <wa-divider></wa-divider>
              <wa-dropdown-item value="https://books.raggiesoft.com">
                <wa-icon slot="icon" family="duotone" name="book-open-cover" aria-hidden="true"></wa-icon>
                Open RaggieSoft Book Reader ↗
              </wa-dropdown-item>
              <wa-dropdown-item value="https://music.raggiesoft.com">
                <wa-icon slot="icon" family="duotone" name="headphones" aria-hidden="true"></wa-icon>
                Open The Listening Room ↗
              </wa-dropdown-item>
            </wa-dropdown>

            <wa-tooltip for="bs-install-app">Install RaggieSoft Backstage to your home screen or desktop</wa-tooltip>
            <wa-button id="bs-install-app" hidden variant="brand" appearance="filled-outlined" size="small">
              <wa-icon slot="start" family="duotone" name="arrow-down-to-bracket" swap-opacity aria-hidden="true"></wa-icon>
              <span class="bs-install-label">Install App</span>
            </wa-button>

            <wa-tooltip for="bs-open-appearance">Customize lighting, visual style, and color palette</wa-tooltip>
            <wa-button id="bs-open-appearance" variant="neutral" appearance="filled-outlined" size="small">
              <wa-icon slot="start" family="duotone" name="sliders" swap-opacity aria-hidden="true"></wa-icon>
              <span class="bs-appearance-label">Appearance</span>
            </wa-button>
          </div>
        </div>
      </div>

      ${subheaderHtml}

      <div id="content" class="bs-container" tabindex="-1">
        ${bodyHtml}
      </div>

      ${asideHtml}

      <div slot="footer" class="bs-footer">
        <div class="bs-container">
          <div class="bs-disclaimer" role="note" aria-label="Fictitious Persons and Entities Disclaimer">
            <strong>Fictitious Persons, Universities, Bands &amp; Entities Disclaimer:</strong> All narrative characters, bands (including The Stardust Engine, Fractured Prisms, Crimson Node, The Paper Wall, Mana Canvas, The Arctic Symphony Project, and Teller County), biographies, universities and schools (including <strong>Commonwealth Polytechnic Institute / CPI</strong>, Virginia Dominion University / VDU, The Forgers, The Crucible, Eleanor Bennett Commonwealth Hall, Callahan Hall, Kincaid Commons, and Morrison Middle School), academies and theme parks (including Tidewater Tumblers, Lynnhaven Academy of Seondu, Seonduwon, and Brewster Gardens), corporations (including OmniCorp, Vectron Energy Corp., Quantum Corporation, Apex Records, Prairie Coachworks, and Sainte-Claire), transit agencies (Coastal Virginia Transit Authority / CVTA, Blue Ridge Transit, Bluewater Transit, Roanoke Valley Transit, Radford Transit, and Mountain Valley Transit), in-universe administrative correspondence, legal filings, and any entity with <strong>&ldquo;LLC&rdquo;</strong>, <strong>&ldquo;Trust&rdquo;</strong>, or <strong>&ldquo;Holdings&rdquo;</strong> in its name (including <em>Engine Room Records, LLC</em>, <em>The O'Connell Family, LLC</em>, <em>Artists First Management, LLC</em>, <em>Stardust Properties, LLC</em>, <em>Stardust Blacksburg, LLC</em>, <em>Stardust Strategic Assets, LLC</em>, <em>Pacific Rim Properties, LLC</em>, <em>Jessica Miller Center, LLC</em>, and <em>Aethelgard Holdings, LLC</em>) are <strong>100% works of fiction</strong> inside the RaggieSoft universe. Any resemblance to actual persons (living or dead), universities, businesses, institutions, or events is purely coincidental. In real life, there is only <strong>Engine Room Records</strong> (no &ldquo;LLC&rdquo;), the real-world creative brand under which <strong>Michael P. Ragsdale</strong> distributes his music.
          </div>
          <div class="bs-footer-bar">
            <p>
              &copy; 2026 Michael P. Ragsdale / RaggieSoft. Code licensed under the
              <a href="https://opensource.org/licenses/MIT" class="bs-link" target="_blank" rel="noopener noreferrer">MIT License</a>.
              Creative content licensed under
              <a href="https://creativecommons.org/licenses/by-sa/4.0/" class="bs-link" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.
            </p>
            <div class="bs-footer-links">
              <a href="https://books.raggiesoft.com" class="bs-link"><wa-icon family="duotone" name="book-open-cover" aria-hidden="true"></wa-icon> RaggieSoft Book Reader</a>
              <a href="https://music.raggiesoft.com" class="bs-link"><wa-icon family="duotone" name="headphones" aria-hidden="true"></wa-icon> The Listening Room</a>
              <a href="https://raggiesoft.com" class="bs-link"><wa-icon family="duotone" name="globe" aria-hidden="true"></wa-icon> RaggieSoft Hub</a>
            </div>
          </div>
        </div>
      </div>
    </wa-page>

    <!-- Progressive Disclosure Appearance & Theme Studio (<wa-drawer>) -->
    <wa-drawer id="bs-appearance-drawer" label="Reading Appearance Studio" placement="end" light-dismiss>
      <div class="bs-studio-stack">
        <p class="bs-studio-note">
          Tailor lighting, visual style, and editorial color tones for comfortable reading day or night. Your choices stay saved on this device.
        </p>

        <wa-radio-group id="bs-scheme-radios" label="Lighting" orientation="horizontal" value="system">
          <wa-radio appearance="button" value="system">
            Match Device <span id="bs-system-hint">(Auto)</span>
          </wa-radio>
          <wa-radio appearance="button" value="light">Light</wa-radio>
          <wa-radio appearance="button" value="dark">Dark</wa-radio>
        </wa-radio-group>

        <wa-divider></wa-divider>

        <wa-radio-group id="bs-theme-radios" label="Visual Style" value="default">
          <wa-radio value="default">Default — Crisp Archival</wa-radio>
          <wa-radio value="awesome">Awesome — Expressive Playbill</wa-radio>
          <wa-radio value="glossy">Glossy — Screening Room</wa-radio>
          <wa-radio value="mellow">Mellow — Warm Reading Lamp</wa-radio>
          <wa-radio value="premium">Premium — Editorial Press</wa-radio>
        </wa-radio-group>

        <wa-divider></wa-divider>

        <wa-radio-group id="bs-palette-radios" label="Color Palette" value="default">
          <wa-radio value="default">Default — Slate &amp; Crimson</wa-radio>
          <wa-radio value="elegant">Elegant — Ivory &amp; Charcoal</wa-radio>
          <wa-radio value="natural">Natural — Botanical Stone</wa-radio>
          <wa-radio value="vogue">Vogue — Theatrical Noir</wa-radio>
        </wa-radio-group>
      </div>

      <div slot="footer" class="bs-card-actions">
        <wa-button id="bs-reset-appearance" variant="neutral" appearance="outlined" size="small">
          <wa-icon slot="start" family="duotone" name="rotate-left" aria-hidden="true"></wa-icon>
          Reset to Defaults
        </wa-button>
        <wa-button id="bs-close-appearance" variant="brand" size="small">
          Done
        </wa-button>
      </div>
    </wa-drawer>

    <!-- iOS / iPadOS Add-to-Home-Screen Guide (<wa-dialog>) -->
    <wa-dialog id="bs-ios-install-dialog" label="Install RaggieSoft Backstage" light-dismiss>
      <div class="bs-install-steps">
        <p class="bs-studio-note">
          Add <strong>RaggieSoft Backstage</strong> to your iPhone or iPad Home Screen for full-screen reading, custom launch splash screens, and instant offline access alongside <strong>RaggieSoft Book Reader</strong> and <strong>The Listening Room</strong>:
        </p>
        <wa-callout variant="brand">
          <wa-icon slot="icon" family="duotone" name="arrow-up-from-bracket" aria-hidden="true"></wa-icon>
          <strong>Step 1:</strong> Tap the <strong>Share</strong> button in your Safari toolbar.
        </wa-callout>
        <wa-callout variant="neutral">
          <wa-icon slot="icon" family="duotone" name="square-plus" aria-hidden="true"></wa-icon>
          <strong>Step 2:</strong> Scroll down and choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
        </wa-callout>
      </div>
      <div slot="footer" class="bs-card-actions">
        <wa-button id="bs-close-ios-install" variant="brand" size="small">Got It</wa-button>
      </div>
    </wa-dialog>

    <!-- Quick View Dossier Modal (<wa-dialog>) -->
    <wa-dialog id="bs-preview-dialog" class="bs-dialog-width" label="Backstage Quick View" light-dismiss>
      <div id="bs-preview-meta" class="bs-dialog-meta"></div>
      <div id="bs-preview-body"></div>
      <div slot="footer" class="bs-footer-bar">
        <span class="bs-copy-pill">
          <span>Copy Link:</span>
          <wa-copy-button id="bs-preview-copy" value="https://backstage.raggiesoft.com/" copy-label="Copy link to this dossier" success-label="Copied!"></wa-copy-button>
        </span>
        <div class="bs-card-actions">
          <wa-button id="bs-preview-close" variant="neutral" appearance="outlined" size="small">
            Close
          </wa-button>
          <wa-button id="bs-preview-full-link" variant="brand" size="small" href="/">
            <wa-icon slot="end" family="classic" variant="solid" name="arrow-up-right-from-square" aria-hidden="true"></wa-icon>
            Open Full Dossier Page
          </wa-button>
        </div>
      </div>
    </wa-dialog>

    <script src="/assets/backstage-client.js?v=${ASSET_VERSION}" defer></script>
    <script src="https://assets.raggiesoft.com/common/js/raggiesoft-network.js?v=20261109a" defer></script>
  </body>
</html>`;
}

/**
 * Computes 100% live collection groupings, sparkline series, and dynamic story-era
 * tallies directly from the compiled Markdown dataset (zero hardcoded counts).
 * @param {Record<string, any>[]} items
 */
function computeArchiveGroups(items) {
  const rachelAll = items.filter((i) => i.slug.startsWith('books/rachel'));
  const rachelDossiers = items.filter((i) => i.slug.startsWith('books/rachel/') && i.slug !== 'books/rachel');
  const katieAll = items.filter((i) => i.slug.startsWith('books/katie'));
  const katieDossiers = items.filter((i) => i.slug.startsWith('books/katie/') && i.slug !== 'books/katie');
  const aubrieAll = items.filter((i) => i.slug.startsWith('books/aubrie'));
  const aubrieDossiers = items.filter((i) => i.slug.startsWith('books/aubrie/') && i.slug !== 'books/aubrie');
  const aubrieCorrespondence = items.filter((i) => i.slug.startsWith('books/aubrie/correspondence/'));
  const loreItems = items.filter(
    (i) =>
      !i.slug.startsWith('books/rachel') &&
      !i.slug.startsWith('books/katie') &&
      !i.slug.startsWith('books/aubrie')
  );
  const hubs = items.filter(
    (i) => i.slug === 'books/rachel' || i.slug === 'books/katie' || i.slug === 'books/aubrie'
  );

  const eras = [
    { label: 'Origins & 1990s (1872–2000)', test: (y) => y > 0 && y <= 2000, count: 0 },
    { label: '2001–2010 Era', test: (y) => y >= 2001 && y <= 2010, count: 0 },
    { label: '2014–2015 CPI Era', test: (y) => y >= 2011 && y <= 2015, count: 0 },
    { label: '2016 Capitol Era', test: (y) => y >= 2016 && y <= 2020, count: 0 },
    { label: '2026–2044 Vault & Senate Era', test: (y) => y >= 2021, count: 0 }
  ];

  for (const item of items) {
    const year = Number(String(item.date || '').slice(0, 4)) || 0;
    const bucket = eras.find((e) => e.test(year));
    if (bucket) bucket.count++;
  }

  // Compute live sparkline buckets for each series from actual item dates
  const computeSeriesBuckets = (arr, ranges) =>
    ranges
      .map(([minY, maxY]) =>
        arr.filter((it) => {
          const y = Number(String(it.date || '').slice(0, 4)) || 0;
          return y >= minY && y <= maxY;
        }).length
      )
      .join(' ');

  const sparklines = {
    total: eras.map((e) => e.count).join(' '),
    rachel: computeSeriesBuckets(rachelDossiers, [
      [1995, 1995],
      [1999, 2000],
      [2005, 2007],
      [2026, 2030]
    ]),
    katie: computeSeriesBuckets(katieDossiers, [
      [2001, 2004],
      [2005, 2008],
      [2015, 2016],
      [2026, 2027],
      [2028, 2044]
    ]),
    aubrie: `${aubrieCorrespondence.length} ${Math.max(1, aubrieDossiers.length - aubrieCorrespondence.length)} ${aubrieDossiers.length}`,
    lore: `1 ${Math.max(1, loreItems.length - 1)} ${loreItems.length}`
  };

  return {
    rachelAll,
    rachelDossiers,
    katieAll,
    katieDossiers,
    aubrieAll,
    aubrieDossiers,
    aubrieCorrespondence,
    loreItems,
    eras,
    sparklines,
    counts: {
      rachel: rachelAll.length,
      rachelDossiers: rachelDossiers.length,
      katie: katieAll.length,
      katieDossiers: katieDossiers.length,
      aubrie: aubrieAll.length,
      aubrieDossiers: aubrieDossiers.length,
      aubrieCorrespondence: aubrieCorrespondence.length,
      lore: loreItems.length,
      hubs: hubs.length,
      total: items.length
    }
  };
}

/**
 * Renders an individual Backstage dossier, correspondence, or collection hub page
 * utilizing `<wa-page>`'s `subheader` (breadcrumbs) and `aside` (On This Page & Story Links).
 */
function renderItemPage(item, allItems, groups) {
  const col = describeCollection(item);
  const metaBlocks = [];

  if (item.date) {
    metaBlocks.push(`
      <div class="bs-meta-item">
        <span class="bs-meta-label"><wa-icon family="duotone" name="calendar-day" aria-hidden="true"></wa-icon> Story Date &amp; Time</span>
        <strong>${escapeHtml(item.date)}${item.time ? ` • ${escapeHtml(item.time)}` : ''}</strong>
      </div>
    `);
  }
  if (item.location) {
    metaBlocks.push(`
      <div class="bs-meta-item">
        <span class="bs-meta-label"><wa-icon family="duotone" name="location-dot" aria-hidden="true"></wa-icon> Setting</span>
        <strong>${escapeHtml(item.location)}</strong>
      </div>
    `);
  }
  if (item.sender) {
    metaBlocks.push(`
      <div class="bs-meta-item">
        <span class="bs-meta-label"><wa-icon family="duotone" name="user-pen" aria-hidden="true"></wa-icon> Archival Source</span>
        <strong>${escapeHtml(item.sender)}</strong>
      </div>
    `);
  }
  if (item.recipient) {
    metaBlocks.push(`
      <div class="bs-meta-item">
        <span class="bs-meta-label"><wa-icon family="duotone" name="users" aria-hidden="true"></wa-icon> Addressed To</span>
        <strong>${escapeHtml(item.recipient)}</strong>
      </div>
    `);
  }

  const isRachel = item.slug.startsWith('books/rachel');
  const isKatie = item.slug.startsWith('books/katie');
  const isAubrie = item.slug.startsWith('books/aubrie');
  const isCollectionHub =
    item.slug === 'books/rachel' || item.slug === 'books/katie' || item.slug === 'books/aubrie';

  const hubChildren =
    item.slug === 'books/rachel'
      ? groups.rachelDossiers
      : item.slug === 'books/katie'
        ? groups.katieDossiers
        : item.slug === 'books/aubrie'
          ? groups.aubrieDossiers
          : [];

  const hubGridHtml =
    hubChildren.length > 0
      ? `
    <section aria-labelledby="collection-cards-heading">
      <div class="bs-section-head">
        <h2 id="collection-cards-heading" class="bs-section-title">
          <wa-icon family="duotone" name="layer-group" swap-opacity aria-hidden="true"></wa-icon>
          Browse All ${hubChildren.length} Companion Dossiers
        </h2>
      </div>
      <div class="bs-grid">
        ${hubChildren.map((child) => renderDossierCard(child, true)).join('\n')}
      </div>
    </section>`
      : '';

  const relatedItems = isCollectionHub
    ? []
    : allItems
        .filter((other) => {
          if (
            other.slug === item.slug ||
            other.slug === 'books/rachel' ||
            other.slug === 'books/katie' ||
            other.slug === 'books/aubrie'
          ) {
            return false;
          }
          if (isRachel) return other.slug.startsWith('books/rachel/');
          if (isKatie) return other.slug.startsWith('books/katie/');
          if (isAubrie) return other.slug.startsWith('books/aubrie/');
          return (
            !other.slug.startsWith('books/rachel') &&
            !other.slug.startsWith('books/katie') &&
            !other.slug.startsWith('books/aubrie')
          );
        })
        .slice(0, 6);

  const relatedHtml =
    relatedItems.length > 0
      ? `
    <section aria-labelledby="related-backstage-heading">
      <wa-divider></wa-divider>
      <div class="bs-section-head">
        <h2 id="related-backstage-heading" class="bs-section-title">
          <wa-icon family="duotone" name="folder-tree" swap-opacity aria-hidden="true"></wa-icon>
          More in This Behind-the-Scenes Collection
        </h2>
      </div>
      <wa-scroller orientation="horizontal">
        <div class="bs-scroller-track">
          ${relatedItems
            .map((rel) => `<div class="bs-scroller-card">${renderDossierCard(rel, false)}</div>`)
            .join('\n')}
        </div>
      </wa-scroller>
    </section>`
      : '';

  const parentCollectionHref = isCollectionHub
    ? null
    : isRachel
      ? '/books/rachel'
      : isKatie
        ? '/books/katie'
        : isAubrie
          ? '/books/aubrie'
          : null;

  const parentCollectionLabel = isRachel
    ? `The Rachel Narrative (${groups.counts.rachelDossiers} Dossiers)`
    : isKatie
      ? `Katie & Nathaniel (${groups.counts.katieDossiers} Dossiers)`
      : isAubrie
        ? `The Eleventh Child (${groups.counts.aubrieDossiers} Files)`
        : '';

  const subheaderHtml = `
      <div slot="subheader" class="bs-subheader">
        <div class="bs-container bs-subheader-inner">
          <wa-breadcrumb label="Backstage Archive Path">
            <wa-breadcrumb-item href="/">
              <wa-icon slot="start" family="duotone" name="clapperboard-play" aria-hidden="true"></wa-icon>
              RaggieSoft Backstage
            </wa-breadcrumb-item>
            ${
              parentCollectionHref
                ? `<wa-breadcrumb-item href="${parentCollectionHref}">${escapeHtml(parentCollectionLabel)}</wa-breadcrumb-item>`
                : ''
            }
            <wa-breadcrumb-item>${escapeHtml(item.title)}</wa-breadcrumb-item>
          </wa-breadcrumb>
        </div>
      </div>`;

  // Sticky right-hand <wa-page slot="aside"> rail on individual dossier/guide pages
  const tocItems = Array.isArray(item.toc) ? item.toc : [];
  const asideHtml = isCollectionHub
    ? ''
    : `
      <div slot="aside" class="bs-aside-rail">
        ${
          tocItems.length > 0
            ? `<wa-card class="bs-aside-card">
                <h2 class="bs-aside-heading">
                  <wa-icon family="duotone" name="list-tree" aria-hidden="true"></wa-icon>
                  On This Page
                </h2>
                <ul class="bs-toc-list">
                  ${tocItems
                    .map(
                      (h) =>
                        `<li><a href="#${escapeHtml(h.id)}" class="bs-toc-link">${escapeHtml(h.text)}</a></li>`
                    )
                    .join('\n                  ')}
                </ul>
              </wa-card>`
            : ''
        }
        <wa-card class="bs-aside-card">
          <h2 class="bs-aside-heading">
            <wa-icon family="duotone" name="compass" aria-hidden="true"></wa-icon>
            Story Companion
          </h2>
          <div class="bs-studio-stack" style="gap: 0.6rem;">
            ${
              item.relatedBookUrl
                ? `<wa-button variant="brand" size="small" href="${escapeHtml(item.relatedBookUrl)}">
                    <wa-icon slot="start" family="duotone" name="book-open-cover" aria-hidden="true"></wa-icon>
                    ${escapeHtml(item.relatedBookLabel)} ↗
                  </wa-button>`
                : ''
            }
            ${
              parentCollectionHref
                ? `<wa-button variant="neutral" appearance="outlined" size="small" href="${parentCollectionHref}">
                    <wa-icon slot="start" family="duotone" name="layer-group" aria-hidden="true"></wa-icon>
                    ${escapeHtml(parentCollectionLabel)}
                  </wa-button>`
                : ''
            }
            <div class="bs-qr-panel" style="margin-inline: auto; padding-block-start: 0.35rem;">
              <wa-qr-code value="${escapeHtml(item.canonicalUrl)}" label="QR code to open ${escapeHtml(item.title)} on a phone or tablet" size="124"></wa-qr-code>
              <p class="bs-qr-caption">Scan to continue reading on your phone or tablet.</p>
            </div>
          </div>
        </wa-card>
      </div>`;

  // LCP Hero Illustration when `item.image` is present (`fetchpriority="high"`, never `loading="lazy"`)
  const heroMediaHtml = item.image
    ? `
    <figure class="bs-dossier-hero">
      <img
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.imageAlt || item.title)}"
        width="1408"
        height="768"
        fetchpriority="high"
        class="bs-dossier-hero-img"
      />
      ${
        item.imageAlt
          ? `<figcaption class="bs-dossier-hero-caption">${escapeHtml(item.imageAlt)}</figcaption>`
          : ''
      }
    </figure>`
    : '';

  const bodyHtml = `
    <div class="bs-hero">
      <div class="bs-badge-strip">
        <wa-badge variant="${col.badgeVariant}" appearance="filled" pill>
          <wa-icon family="${col.iconFamily}" name="${col.iconName}" swap-opacity aria-hidden="true"></wa-icon>&nbsp;${escapeHtml(item.category)}
        </wa-badge>
        ${
          item.date
            ? `<wa-tag size="small" pill><wa-icon family="classic" variant="regular" name="clock" aria-hidden="true"></wa-icon>&nbsp;${escapeHtml(item.date)}</wa-tag>`
            : ''
        }
      </div>

      <h1 class="bs-title">${escapeHtml(item.title)}</h1>
      ${item.subtitle ? `<p class="bs-subtitle">${escapeHtml(item.subtitle)}</p>` : ''}

      <div class="bs-action-row">
        ${
          item.relatedBookUrl
            ? `<wa-button variant="brand" href="${escapeHtml(item.relatedBookUrl)}">
                <wa-icon slot="start" family="duotone" name="book-open-cover" swap-opacity aria-hidden="true"></wa-icon>
                ${escapeHtml(item.relatedBookLabel)} ↗
              </wa-button>`
            : ''
        }
        ${
          parentCollectionHref
            ? `<wa-button variant="neutral" appearance="outlined" href="${parentCollectionHref}">
                <wa-icon slot="start" family="duotone" name="layer-group" aria-hidden="true"></wa-icon>
                ${escapeHtml(parentCollectionLabel)}
              </wa-button>`
            : `<wa-button variant="neutral" appearance="outlined" href="/">
                <wa-icon slot="start" family="duotone" name="film" aria-hidden="true"></wa-icon>
                All ${groups.counts.total} Backstage Records
              </wa-button>`
        }
        <span class="bs-copy-pill">
          <span>Copy Link:</span>
          <wa-copy-button value="${escapeHtml(item.canonicalUrl)}" copy-label="Copy direct link to this dossier" success-label="Link copied!"></wa-copy-button>
        </span>

        <wa-button id="bs-qr-trigger" variant="neutral" appearance="outlined" size="small">
          <wa-icon slot="start" family="duotone" name="qrcode" aria-hidden="true"></wa-icon>
          Read on Phone
        </wa-button>
        <wa-popover for="bs-qr-trigger" placement="bottom">
          <div class="bs-qr-panel">
            <wa-qr-code value="${escapeHtml(item.canonicalUrl)}" label="QR code to open ${escapeHtml(item.title)} on a phone or tablet" size="148"></wa-qr-code>
            <p class="bs-qr-caption">Scan with your camera to continue reading this dossier on your phone or tablet.</p>
          </div>
        </wa-popover>
      </div>

      ${metaBlocks.length > 0 ? `<div class="bs-meta-grid">${metaBlocks.join('')}</div>` : ''}
    </div>

    ${heroMediaHtml}

    <wa-card class="bs-article-card">
      <article class="bs-article-prose" aria-label="${escapeHtml(item.title)}">
        ${item.html}
      </article>
    </wa-card>

    ${hubGridHtml}
    ${relatedHtml}
  `;

  return renderBackstageShell({
    title: `${item.title} | RaggieSoft Backstage`,
    description: item.summary,
    canonicalPath: item.routePath,
    ogImage: item.ogImage || resolveOgImageForSlug(item.slug),
    ogImageAlt: item.imageAlt || item.summary || item.title,
    counts: groups.counts,
    subheaderHtml,
    asideHtml,
    bodyHtml
  });
}

/**
 * Renders the flagship RaggieSoft Backstage homepage (`/index.html`) showcasing
 * Web Awesome Pro 3.13.0 `<wa-page>`, `<wa-carousel>`, `<wa-data-grid>`, `<wa-tree>`,
 * `<wa-bar-chart>`, `<wa-doughnut-chart>`, `<wa-sparkline>`, and Font Awesome Pro+.
 */
function renderHomePage(items, groups) {
  const {
    rachelAll,
    rachelDossiers,
    katieAll,
    katieDossiers,
    aubrieAll,
    aubrieDossiers,
    aubrieCorrespondence,
    loreItems,
    eras,
    sparklines,
    counts
  } = groups;

  // Build clean client dataset for <wa-data-grid> and <wa-tree>
  const ledgerRows = items.map((item) => {
    const col = describeCollection(item);
    return {
      slug: item.slug,
      routePath: item.routePath,
      date: item.date || '—',
      title: item.title,
      collection: col.label,
      origin: item.sender || item.location || 'Ocean View Archives',
      summary: item.summary
    };
  });

  const defaultTreeItem = rachelDossiers[0] || katieDossiers[0] || items[0];

  const barChartConfig = {
    data: {
      labels: eras.map((e) => e.label),
      datasets: [
        {
          label: 'Published Archival Records',
          data: eras.map((e) => e.count)
        }
      ]
    }
  };

  const doughnutChartConfig = {
    data: {
      labels: [
        `The Rachel Narrative (${counts.rachel})`,
        `Katie & Nathaniel (${counts.katie})`,
        `The Eleventh Child (${counts.aubrie})`,
        `Campus, Music & Corporate (${counts.lore})`
      ],
      datasets: [
        {
          label: 'Records by Collection',
          data: [counts.rachel, counts.katie, counts.aubrie, counts.lore]
        }
      ]
    }
  };

  const searchChips = [
    'Bear and Bug',
    'Ashley Raybourn',
    'Dirksen Room 511',
    'HB 663',
    'Suite 214/216',
    'Commonwealth Polytechnic',
    'Stardust Engine',
    'Code Susquehanna'
  ];

  const featuredSlides = [
    {
      kicker: 'The Rachel Narrative • Bear & Bug Sanctuary',
      title: 'Why Rachel Is the Center of Michael’s Universe',
      desc: 'Ten behind-the-scenes dossiers spanning the 1995 living room sanctuary, school nurse briefings, Lynnhaven Seondu, and the 2026 vault.',
      src: 'https://assets.raggiesoft.com/raggiesoft-backstage/images/scenes/rachel-bug-and-bear-sanctuary.jpg',
      alt: 'Young teenage Michael and younger sister Rachel seated peacefully side-by-side on their sunlit Virginia Beach living room sofa in modest everyday clothing with two black Labradors resting calmly at their feet.',
      href: '/books/rachel',
      cta: `Explore Rachel (${counts.rachelDossiers} Dossiers)`
    },
    {
      kicker: 'May 13, 1999 • Morrison Middle School Band Corridor',
      title: 'The Wingman Briefing: Ashley Raybourn & Bonnie Reed',
      desc: 'Two days before Brewster Gardens, Ashley pulls Bonnie into the hallway outside the band room to explain Michael’s grounding hugs and “The Trio.”',
      src: 'https://assets.raggiesoft.com/raggiesoft-backstage/images/scenes/rachel-wingman-briefing-ashley-bonnie-1999.jpg',
      alt: 'Fourteen-year-old eighth-grader Ashley Raybourn in her light sky-blue crewneck t-shirt and golden-blonde ponytail holding wooden snare drumsticks outside the Morrison Middle School band room doors as she talks earnestly with Bonnie Reed in her deep-burgundy long-sleeve top cradling her black music binder.',
      href: '/books/rachel/the-wingman-briefing-ashley-and-bonnie',
      cta: 'Read the Hallway Briefing'
    },
    {
      kicker: 'Katie & Nathaniel • 2001–2044 Companion Archive',
      title: 'Senators Katie & Nathaniel Prairie on Capitol Hill',
      desc: 'From Barton Hall’s Rec Hall and Richmond’s HB 663 showdown to Dirksen Room 511 and the 2044 Route 15 Bus-Stop Primary.',
      src: 'https://assets.raggiesoft.com/raggiesoft-backstage/images/scenes/katie-nate-us-senate-corridor.jpg',
      alt: 'Senators Katie and Nathaniel Prairie rolling side-by-side in their custom power wheelchairs down a sunlit marble corridor in the United States Senate.',
      href: '/books/katie',
      cta: `Explore Katie & Nathaniel (${counts.katieDossiers} Dossiers)`
    },
    {
      kicker: 'Locations & Architecture • Founded 1872',
      title: 'Commonwealth Polytechnic Institute (CPI) — Preston Hall & The Green',
      desc: 'Explore Appalachian Ironstone towers, Kincaid Hall & Kincaid Commons, The Crucible, and the Poly Pass transit network.',
      src: 'https://assets.raggiesoft.com/raggiesoft-backstage/images/scenes/cpi-preston-hall-commonwealth-green.jpg',
      alt: 'Preston Hall’s Neo-Gothic Ironstone turrets overlooking the sweeping oval lawn of Commonwealth Green in Blacksburg autumn sunlight.',
      href: '/locations/cpi',
      cta: 'Open CPI Campus Guide'
    },
    {
      kicker: 'Blacksburg Regional Transit • Commonwealth Mall',
      title: 'The Keystone Bridge & Blue Ridge Transit Route 1',
      desc: 'How regional low-floor Prairie Coachworks buses connect Commonwealth Mall, Kincaid Hall, and Christiansburg on a student Poly Pass.',
      src: 'https://assets.raggiesoft.com/raggiesoft-backstage/images/scenes/cpi-keystone-bridge-commonwealth-mall.jpg',
      alt: 'The monumental Ironstone arch of The Keystone Bridge spanning Commonwealth Mall at dusk as an accessible low-floor Blue Ridge Transit bus glides beneath warm campus streetlights.',
      href: '/locations/cpi#sec-4-the-poly-pass-regional-transit-ecosystem',
      cta: 'Explore Poly Pass Transit'
    },
    {
      kicker: 'The Eleventh Child • Eleanor Bennett Commonwealth Hall',
      title: 'Suite 214/216 & CPI Administrative Correspondence',
      desc: 'Read Residence Life, Office of Educational Accessibility, Radford Transit, and Isabel Dawson’s Room 215 records.',
      src: 'https://assets.raggiesoft.com/raggiesoft-books/images/scenes/aubrie/baselines/room-214-lived-in-baseline.jpg',
      alt: 'Warm sunlit dorm interior of accessible Suite 214 at Eleanor Bennett Commonwealth Hall on the West Campus quad of CPI.',
      href: '/books/aubrie',
      cta: `Explore Eleventh Child (${counts.aubrieDossiers} Files)`
    },
    {
      kicker: 'Engine Room Records • Progress Street NE, 1986',
      title: 'The Stardust Engine & 300 Marching Forgers',
      desc: 'How siblings Ryan, Cassidy, and Holly O’Connell and twin cousins Evan and Tyler Wright forged their 1986 Blacksburg debut.',
      src: 'https://assets.raggiesoft.com/raggiesoft-books/images/scenes/aubrie/e008/c004/p002/stardust-engine-300-marching-forgers.jpg',
      alt: 'The Stardust Engine performing alongside 300 Marching Forgers brass and percussion musicians under stadium lights in Blacksburg.',
      href: '/music/stardust-engine-origins',
      cta: 'Read 1986 Band Origins'
    }
  ];

  const carouselSlidesHtml = featuredSlides
    .map((slide, idx) => {
      // Slide 0 is the above-the-fold LCP image (fetchpriority="high", NO loading="lazy");
      // slides 1..6 are initially hidden carousel slides (fetchpriority="low" loading="lazy").
      const priorityAttrs =
        idx === 0 ? 'fetchpriority="high"' : 'fetchpriority="low" loading="lazy"';
      return `
          <wa-carousel-item>
            <figure class="bs-slide-frame">
              <img
                src="${escapeHtml(slide.src)}"
                alt="${escapeHtml(slide.alt)}"
                width="1408"
                height="768"
                ${priorityAttrs}
                class="bs-slide-img"
              />
              <figcaption class="bs-slide-overlay">
                <div class="bs-slide-copy">
                  <span class="bs-slide-kicker">${escapeHtml(slide.kicker)}</span>
                  <h3 class="bs-slide-title">${escapeHtml(slide.title)}</h3>
                  <p class="bs-slide-desc">${escapeHtml(slide.desc)}</p>
                </div>
                <wa-button variant="brand" size="small" href="${slide.href}">
                  ${escapeHtml(slide.cta)}
                  <wa-icon slot="end" family="classic" variant="solid" name="arrow-right" aria-hidden="true"></wa-icon>
                </wa-button>
              </figcaption>
            </figure>
          </wa-carousel-item>`;
    })
    .join('\n');

  const bodyHtml = `
    <div class="bs-hero">
      <div class="bs-badge-strip">
        <wa-badge variant="brand" appearance="filled" pill>
          <wa-icon family="duotone" name="clapperboard-play" swap-opacity aria-hidden="true"></wa-icon>&nbsp;Official Companion Archive (${counts.total} Live Records)
        </wa-badge>
        <wa-badge variant="success" appearance="filled-outlined" pill>
          <wa-icon family="duotone" name="shield-heart" aria-hidden="true"></wa-icon>&nbsp;${counts.rachelDossiers} Rachel Dossiers
        </wa-badge>
        <wa-badge variant="neutral" appearance="filled-outlined" pill>
          <wa-icon family="duotone" name="wheelchair-move" aria-hidden="true"></wa-icon>&nbsp;${counts.katieDossiers} Katie &amp; Nathaniel Dossiers
        </wa-badge>
        <wa-badge variant="neutral" appearance="filled-outlined" pill>
          <wa-icon family="duotone" name="book-sparkles" aria-hidden="true"></wa-icon>&nbsp;${counts.aubrieDossiers} Eleventh Child Files
        </wa-badge>
        <wa-badge variant="neutral" appearance="filled-outlined" pill>
          <wa-icon family="duotone" name="building-columns" aria-hidden="true"></wa-icon>&nbsp;${counts.lore} Worldbuilding Guides
        </wa-badge>
      </div>

      <h1 class="bs-title">
        RaggieSoft Backstage: Behind the Scenes &amp; In-Universe Bonus Features
      </h1>
      <p class="bs-subtitle">
        Every Ocean View Archives novel stays anchored to its narrator&rsquo;s lived, in-the-moment point of view. <strong>RaggieSoft Backstage</strong> opens the closed doors down the hall—revealing what happened outside the <strong>Morrison Middle School Band Room</strong>, across the courtyard at <strong>Roosevelt Rehabilitation Center</strong>, inside <strong>Dirksen Room 511</strong>, and across the campus of <strong>Commonwealth Polytechnic Institute (CPI)</strong>.
      </p>

      <wa-callout variant="brand">
        <wa-icon slot="icon" family="duotone" name="stars" swap-opacity aria-hidden="true"></wa-icon>
        <strong>New Addition — <em>The Rachel Narrative</em> Behind-the-Scenes Archive (${counts.rachelDossiers} Dossiers, 1995–2026):</strong>
        Step into the hallway outside the Morrison Band Room as <strong>Ashley Raybourn</strong> explains to <strong>Bonnie Reed</strong> who sixth-grader Rachel is and why she is the center of Michael&rsquo;s universe—alongside David Miller&rsquo;s 1995 precinct interview, the confidential school-nurse briefing, Jessica Miller&rsquo;s 1999 bare-metal discovery inside <em>PROGMAN.EXE</em>, and <strong>Code Susquehanna</strong>.
        <div class="bs-action-row">
          <wa-button variant="brand" size="small" href="/books/rachel/the-wingman-briefing-ashley-and-bonnie">
            <wa-icon slot="start" family="duotone" name="comments" swap-opacity aria-hidden="true"></wa-icon>
            Read Ashley &amp; Bonnie&rsquo;s Briefing
          </wa-button>
          <wa-button variant="neutral" appearance="outlined" size="small" href="/books/rachel">
            <wa-icon slot="start" family="duotone" name="shield-heart" aria-hidden="true"></wa-icon>
            Rachel Archive (${counts.rachelDossiers})
          </wa-button>
          <wa-button variant="neutral" appearance="outlined" size="small" href="/books/katie">
            <wa-icon slot="start" family="duotone" name="wheelchair-move" aria-hidden="true"></wa-icon>
            Katie &amp; Nathaniel (${counts.katieDossiers})
          </wa-button>
          <wa-button variant="neutral" appearance="outlined" size="small" href="/locations/cpi">
            <wa-icon slot="start" family="duotone" name="building-columns" aria-hidden="true"></wa-icon>
            CPI Campus Guide
          </wa-button>
        </div>
      </wa-callout>

      <search class="bs-search-box">
        <div class="bs-search-header">
          <label for="backstage-search" class="bs-search-label">
            <wa-icon family="duotone" name="magnifying-glass" swap-opacity aria-hidden="true"></wa-icon>
            Search All Dossiers, Campus Guides &amp; Correspondence
          </label>
          <span id="backstage-search-count" class="bs-search-count" aria-live="polite">
            Showing all ${counts.total} records
          </span>
        </div>
        <wa-input
          id="backstage-search"
          type="search"
          size="large"
          pill
          with-clear
          placeholder="Try 'Bear and Bug', 'Ashley Raybourn', 'Dirksen Room 511', 'HB 663', 'Suite 214/216', or 'PROGMAN.EXE'…"
        >
          <wa-icon slot="start" family="duotone" name="magnifying-glass" aria-hidden="true"></wa-icon>
        </wa-input>
        <div class="bs-chip-row">
          <span class="bs-chip-caption">Popular topics:</span>
          ${searchChips
            .map(
              (chip) =>
                `<wa-button variant="neutral" appearance="outlined" size="small" pill data-bs-filter-term="${escapeHtml(chip)}">${escapeHtml(chip)}</wa-button>`
            )
            .join('\n          ')}
        </div>
      </search>
    </div>

    <!-- Visual Scene Tour (<wa-carousel>) -->
    <section class="bs-carousel-section" aria-labelledby="scene-tour-heading">
      <div class="bs-section-head">
        <h2 id="scene-tour-heading" class="bs-section-title">
          <wa-icon family="duotone" name="panorama" swap-opacity aria-hidden="true"></wa-icon>
          Scenes &amp; Worlds Across RaggieSoft Backstage
        </h2>
        <p class="bs-section-lead">Step inside illustrated moments from Virginia Beach, Blacksburg, Richmond, and the United States Senate.</p>
      </div>

      <wa-carousel navigation pagination loop mouse-dragging class="bs-scene-carousel">
        ${carouselSlidesHtml}
      </wa-carousel>
    </section>

    <!-- Archive Pulse Highlight Strip (<wa-card> + <wa-sparkline>) -->
    <section aria-labelledby="archive-pulse-heading">
      <div class="bs-section-head">
        <h2 id="archive-pulse-heading" class="bs-section-title">
          <wa-icon family="duotone" name="chart-mixed" swap-opacity aria-hidden="true"></wa-icon>
          Archive at a Glance
        </h2>
        <p class="bs-section-lead">100% live counts compiled directly from ${counts.total} published Markdown files (${counts.total - counts.hubs} individual dossiers &amp; guides + ${counts.hubs} series hubs).</p>
      </div>

      <div class="bs-pulse-grid">
        <wa-card class="bs-pulse-card">
          <div class="bs-pulse-top">
            <div>
              <span class="bs-pulse-title">Total Bonus Records</span>
              <span class="bs-pulse-value">${counts.total}</span>
            </div>
            <wa-badge variant="brand" appearance="filled" pill>
              <wa-icon family="duotone" name="box-archive" aria-hidden="true"></wa-icon>&nbsp;Live
            </wa-badge>
          </div>
          <wa-sparkline data="${sparklines.total}" appearance="gradient" curve="natural" trend="positive" label="Distribution of ${counts.total} records across five narrative eras"></wa-sparkline>
          <p class="bs-pulse-caption">Every companion dossier, correspondence thread, worldbuilding guide, and series index.</p>
        </wa-card>

        <wa-card class="bs-pulse-card">
          <div class="bs-pulse-top">
            <div>
              <span class="bs-pulse-title">The Rachel Narrative</span>
              <span class="bs-pulse-value">${counts.rachelDossiers} Dossiers</span>
            </div>
            <wa-badge variant="success" appearance="filled-outlined" pill>1995–2026</wa-badge>
          </div>
          <wa-sparkline data="${sparklines.rachel}" appearance="gradient" curve="natural" trend="positive" label="The Rachel Narrative dossiers from 1995 through 2026"></wa-sparkline>
          <p class="bs-pulse-caption">Bear &amp; Bug sanctuary protocols, Ashley &amp; Bonnie&rsquo;s 1999 hallway briefing, and Code Susquehanna.</p>
        </wa-card>

        <wa-card class="bs-pulse-card">
          <div class="bs-pulse-top">
            <div>
              <span class="bs-pulse-title">Katie &amp; Nathaniel</span>
              <span class="bs-pulse-value">${counts.katieDossiers} Dossiers</span>
            </div>
            <wa-badge variant="brand" appearance="filled-outlined" pill>2001–2044</wa-badge>
          </div>
          <wa-sparkline data="${sparklines.katie}" appearance="gradient" curve="natural" trend="positive" label="Katie and Nathaniel dossiers from 2001 through 2044"></wa-sparkline>
          <p class="bs-pulse-caption">Tidewater, Roosevelt Rehab, Capitol Square, Dirksen Room 511, and the U.S. Senate.</p>
        </wa-card>

        <wa-card class="bs-pulse-card">
          <div class="bs-pulse-top">
            <div>
              <span class="bs-pulse-title">The Eleventh Child</span>
              <span class="bs-pulse-value">${counts.aubrieDossiers} Files</span>
            </div>
            <wa-badge variant="neutral" appearance="filled-outlined" pill>2014–2015</wa-badge>
          </div>
          <wa-sparkline data="${sparklines.aubrie}" appearance="gradient" curve="natural" trend="neutral" label="Eleventh Child dispatches across Fall 2014 and Summer 2015"></wa-sparkline>
          <p class="bs-pulse-caption">${counts.aubrieCorrespondence} CPI administrative mail dispatches, Isabel&rsquo;s Room 215 notes, and Zoë&rsquo;s cognitive logs.</p>
        </wa-card>

        <wa-card class="bs-pulse-card">
          <div class="bs-pulse-top">
            <div>
              <span class="bs-pulse-title">Worldbuilding &amp; Music</span>
              <span class="bs-pulse-value">${counts.lore} Guides</span>
            </div>
            <wa-badge variant="warning" appearance="filled-outlined" pill>1872–2001</wa-badge>
          </div>
          <wa-sparkline data="${sparklines.lore}" appearance="gradient" curve="natural" trend="positive" label="Foundational campus, music, and corporate lore guides"></wa-sparkline>
          <p class="bs-pulse-caption">CPI Blacksburg architecture, The Stardust Engine&rsquo;s 1986 debut, and Vectron Energy Corp.</p>
        </wa-card>
      </div>
    </section>

    <!-- Multi-View Collection & Pro Data Explorer (<wa-tab-group>, <wa-data-grid>, <wa-tree>) -->
    <section aria-labelledby="collections-browser-heading">
      <div class="bs-section-head">
        <h2 id="collections-browser-heading" class="bs-section-title">
          <wa-icon family="duotone" name="books" swap-opacity aria-hidden="true"></wa-icon>
          Explore Backstage Collections
        </h2>
        <p class="bs-section-lead">Switch between story collections, the sortable Archival Ledger, or the interactive Folder Explorer.</p>
      </div>

      <wa-tab-group id="bs-main-tabs">
        <wa-tab slot="nav" panel="rachel">
          <wa-icon family="duotone" name="shield-heart" aria-hidden="true"></wa-icon>&nbsp;Rachel (${counts.rachelDossiers})
        </wa-tab>
        <wa-tab slot="nav" panel="katie">
          <wa-icon family="duotone" name="wheelchair-move" aria-hidden="true"></wa-icon>&nbsp;Katie &amp; Nathaniel (${counts.katieDossiers})
        </wa-tab>
        <wa-tab slot="nav" panel="aubrie">
          <wa-icon family="duotone" name="book-sparkles" aria-hidden="true"></wa-icon>&nbsp;Eleventh Child (${counts.aubrieDossiers})
        </wa-tab>
        <wa-tab slot="nav" panel="lore">
          <wa-icon family="duotone" name="building-columns" aria-hidden="true"></wa-icon>&nbsp;Worldbuilding (${counts.lore})
        </wa-tab>
        <wa-tab slot="nav" panel="ledger">
          <wa-icon family="sharp-duotone" variant="solid" name="table-list" aria-hidden="true"></wa-icon>&nbsp;Archival Ledger
        </wa-tab>
        <wa-tab slot="nav" panel="explorer">
          <wa-icon family="duotone" name="folder-tree" aria-hidden="true"></wa-icon>&nbsp;Folder Tree
        </wa-tab>
        <wa-tab slot="nav" panel="all">
          <wa-icon family="duotone" name="layer-group" aria-hidden="true"></wa-icon>&nbsp;All Records (${counts.total})
        </wa-tab>

        <wa-tab-panel name="rachel">
          <p class="bs-section-lead">
            Companion dossiers to <a href="https://books.raggiesoft.com/rachel" class="bs-link"><em>The Rachel Narrative</em></a> documenting scenes and institutional records that unfolded outside Michael&rsquo;s first-person point of view—from August 1995 in Chesapeake and Virginia Beach to May 1999 outside the Morrison Band Room and October 2026 inside the Bear &amp; Bug Vault.
          </p>
          <div class="bs-grid">
            ${rachelDossiers.map((i) => renderDossierCard(i, false)).join('\n')}
          </div>
        </wa-tab-panel>

        <wa-tab-panel name="katie">
          <p class="bs-section-lead">
            Companion dossiers to <a href="https://books.raggiesoft.com/katie" class="bs-link"><em>Katie &amp; Nathaniel</em></a> revealing what unfolded outside Nathaniel Prairie&rsquo;s first-person perspective—from Arthur Vance&rsquo;s 2001 conference room off Independence Boulevard to Capitol Square and the United States Senate.
          </p>
          <div class="bs-grid">
            ${katieDossiers.map((i) => renderDossierCard(i, false)).join('\n')}
          </div>
        </wa-tab-panel>

        <wa-tab-panel name="aubrie">
          <p class="bs-section-lead">
            Behind-the-scenes dossiers and CPI Residence Life, Office of Educational Accessibility, Radford Transit, and Environmental Health &amp; Safety correspondence for <a href="https://books.raggiesoft.com/aubrie" class="bs-link"><em>The Eleventh Child: The Story of Jordan</em></a>.
          </p>
          <div class="bs-grid">
            ${aubrieDossiers.map((i) => renderDossierCard(i, false)).join('\n')}
          </div>
        </wa-tab-panel>

        <wa-tab-panel name="lore">
          <p class="bs-section-lead">
            Illustrated campus guide for <strong>Commonwealth Polytechnic Institute (CPI)</strong> in Blacksburg, the 1986 origins of <strong>The Stardust Engine</strong> on Progress Street NE, and the <strong>Vectron Energy Corp.</strong> archive.
          </p>
          <div class="bs-grid">
            ${loreItems.map((i) => renderDossierCard(i, false)).join('\n')}
          </div>
        </wa-tab-panel>

        <wa-tab-panel name="ledger">
          <div class="bs-ledger-toolbar">
            <p class="bs-section-lead">
              Sort by story date, filter by collection, resize or pin columns, or expand any row to read its summary and launch Quick View.
            </p>
            <wa-button-group label="Archival Ledger Controls">
              <wa-button id="bs-ledger-group" variant="neutral" appearance="outlined" size="small">
                <wa-icon slot="start" family="duotone" name="object-group" aria-hidden="true"></wa-icon>
                Group by Collection
              </wa-button>
              <wa-button id="bs-ledger-fit" variant="neutral" appearance="outlined" size="small">
                <wa-icon slot="start" family="duotone" name="arrows-left-right-to-line" aria-hidden="true"></wa-icon>
                Fit Columns
              </wa-button>
              <wa-button id="bs-ledger-reset" variant="neutral" appearance="outlined" size="small">
                <wa-icon slot="start" family="duotone" name="rotate-left" aria-hidden="true"></wa-icon>
                Reset View
              </wa-button>
              <wa-button id="bs-ledger-csv" variant="brand" appearance="filled-outlined" size="small">
                <wa-icon slot="start" family="duotone" name="file-arrow-down" aria-hidden="true"></wa-icon>
                Download Table
              </wa-button>
            </wa-button-group>
          </div>

          <wa-data-grid
            id="bs-ledger-grid"
            label="RaggieSoft Backstage Archival Ledger"
            row-key="slug"
            with-search
            with-columns-menu
            with-column-menu
            resizable
            reorderable
            pinnable
            striped
            paginate
            page-size="10"
          ></wa-data-grid>
        </wa-tab-panel>

        <wa-tab-panel name="explorer">
          <p class="bs-section-lead">
            Navigate the Backstage vault by series folder and select any record to inspect its summary before opening the full dossier.
          </p>
          <div class="bs-explorer-split">
            <wa-card class="bs-tree-pane">
              <wa-tree id="bs-archive-tree" selection="leaf" aria-label="Backstage Archive Folders">
                <wa-tree-item expanded>
                  <wa-icon family="duotone" name="shield-heart" aria-hidden="true"></wa-icon>
                  The Rachel Narrative (${counts.rachel})
                  ${rachelAll
                    .map(
                      (item, idx) =>
                        `<wa-tree-item data-slug="${escapeHtml(item.slug)}"${idx === 0 ? ' selected' : ''}>${escapeHtml(item.date ? `${item.date} — ${item.title}` : item.title)}</wa-tree-item>`
                    )
                    .join('\n                  ')}
                </wa-tree-item>
                <wa-tree-item expanded>
                  <wa-icon family="duotone" name="wheelchair-move" aria-hidden="true"></wa-icon>
                  Katie &amp; Nathaniel (${counts.katie})
                  ${katieAll
                    .map(
                      (item) =>
                        `<wa-tree-item data-slug="${escapeHtml(item.slug)}">${escapeHtml(item.date ? `${item.date} — ${item.title}` : item.title)}</wa-tree-item>`
                    )
                    .join('\n                  ')}
                </wa-tree-item>
                <wa-tree-item expanded>
                  <wa-icon family="duotone" name="book-sparkles" aria-hidden="true"></wa-icon>
                  The Eleventh Child (${counts.aubrie})
                  ${aubrieAll
                    .map(
                      (item) =>
                        `<wa-tree-item data-slug="${escapeHtml(item.slug)}">${escapeHtml(item.date ? `${item.date} — ${item.title}` : item.title)}</wa-tree-item>`
                    )
                    .join('\n                  ')}
                </wa-tree-item>
                <wa-tree-item expanded>
                  <wa-icon family="duotone" name="building-columns" aria-hidden="true"></wa-icon>
                  Campus, Music &amp; Corporate (${counts.lore})
                  ${loreItems
                    .map(
                      (item) =>
                        `<wa-tree-item data-slug="${escapeHtml(item.slug)}">${escapeHtml(item.date ? `${item.date} — ${item.title}` : item.title)}</wa-tree-item>`
                    )
                    .join('\n                  ')}
                </wa-tree-item>
              </wa-tree>
            </wa-card>

            <wa-card>
              <div class="bs-card-meta">
                <wa-badge id="bs-tree-collection" variant="brand" appearance="filled-outlined" pill>
                  ${escapeHtml(describeCollection(defaultTreeItem).label)}
                </wa-badge>
                <wa-tag id="bs-tree-date" size="small" pill>${escapeHtml(defaultTreeItem.date || 'Archival Record')}</wa-tag>
              </div>
              <h3 id="bs-tree-title" class="bs-card-title">${escapeHtml(defaultTreeItem.title)}</h3>
              <p id="bs-tree-origin" class="bs-card-subtitle">${escapeHtml(
                defaultTreeItem.sender || defaultTreeItem.location
                  ? `Source / Setting: ${defaultTreeItem.sender || defaultTreeItem.location}`
                  : ''
              )}</p>
              <p id="bs-tree-summary" class="bs-card-summary">${escapeHtml(defaultTreeItem.summary)}</p>
              <div class="bs-action-row">
                <wa-button id="bs-tree-open" variant="brand" size="small" href="${defaultTreeItem.routePath}">
                  <wa-icon slot="start" family="duotone" name="folder-open" aria-hidden="true"></wa-icon>
                  Open Full Dossier
                </wa-button>
                <wa-button id="bs-tree-quick" variant="neutral" appearance="outlined" size="small" data-bs-preview-slug="${escapeHtml(defaultTreeItem.slug)}">
                  <wa-icon slot="start" family="duotone" name="expand" aria-hidden="true"></wa-icon>
                  Quick View
                </wa-button>
              </div>
            </wa-card>
          </div>
        </wa-tab-panel>

        <wa-tab-panel name="all">
          <p class="bs-section-lead">Complete index of all ${counts.total} RaggieSoft Backstage records (including series overview hubs).</p>
          <div class="bs-grid">
            ${items.map((i) => renderDossierCard(i, true)).join('\n')}
          </div>
        </wa-tab-panel>
      </wa-tab-group>
    </section>

    <!-- Story Timeline & Collection Breakdown (<wa-bar-chart> + <wa-doughnut-chart> + Accessible Table) -->
    <section class="bs-charts-section" aria-labelledby="timeline-analytics-heading">
      <div class="bs-section-head">
        <h2 id="timeline-analytics-heading" class="bs-section-title">
          <wa-icon family="duotone" name="timeline" swap-opacity aria-hidden="true"></wa-icon>
          Story Timeline &amp; Collection Breakdown
        </h2>
        <p class="bs-section-lead">How the ${counts.total} behind-the-scenes records span the shared RaggieSoft timeline.</p>
      </div>

      <div class="bs-charts-grid">
        <wa-card>
          <figure class="bs-chart-figure">
            <wa-bar-chart
              label="Published Backstage Records by Story Era"
              description="Bar chart comparing archival records across five narrative eras from 1872 through 2044."
              x-label="Story Era"
              y-label="Records"
              legend-position="top"
            >
              <script type="application/json">${safeJsonForScript(barChartConfig)}</script>
            </wa-bar-chart>
            <figcaption class="bs-chart-caption">
              Chronological distribution from CPI&rsquo;s 1872 founding, The Stardust Engine&rsquo;s 1986 debut, and 1995–1999 Virginia Beach to the 2044 Route 15 primary.
            </figcaption>
          </figure>
        </wa-card>

        <wa-card>
          <figure class="bs-chart-figure">
            <wa-doughnut-chart
              label="Published Backstage Records by Narrative Collection"
              description="Doughnut chart showing proportion of records across The Rachel Narrative, Katie and Nathaniel, The Eleventh Child, and Worldbuilding guides."
              legend-position="bottom"
            >
              <script type="application/json">${safeJsonForScript(doughnutChartConfig)}</script>
            </wa-doughnut-chart>
            <figcaption class="bs-chart-caption">
              Proportional breakdown across novel companion archives and shared campus, music, and corporate lore.
            </figcaption>
          </figure>
        </wa-card>
      </div>

      <wa-details summary="View timeline and collection numbers as a text table">
        <table class="bs-data-table">
          <caption>RaggieSoft Backstage Records by Story Era and Collection</caption>
          <thead>
            <tr>
              <th scope="col">Group</th>
              <th scope="col">Category</th>
              <th scope="col">Published Records</th>
            </tr>
          </thead>
          <tbody>
            ${eras
              .map(
                (e) =>
                  `<tr><td>Story Era</td><td>${escapeHtml(e.label)}</td><td>${e.count}</td></tr>`
              )
              .join('\n            ')}
            <tr><td>Collection</td><td>The Rachel Narrative</td><td>${counts.rachel}</td></tr>
            <tr><td>Collection</td><td>Katie &amp; Nathaniel</td><td>${counts.katie}</td></tr>
            <tr><td>Collection</td><td>The Eleventh Child</td><td>${counts.aubrie}</td></tr>
            <tr><td>Collection</td><td>Campus, Music &amp; Corporate Lore</td><td>${counts.lore}</td></tr>
          </tbody>
        </table>
      </wa-details>
    </section>

    <!-- Reader FAQ (<wa-accordion heading-level="3">) -->
    <section aria-labelledby="faq-heading" style="margin-block-end: 2.5rem;">
      <div class="bs-section-head">
        <h2 id="faq-heading" class="bs-section-title">
          <wa-icon family="duotone" name="circle-question" swap-opacity aria-hidden="true"></wa-icon>
          About RaggieSoft Backstage &amp; Reader Bonus Features
        </h2>
      </div>

      <wa-accordion heading-level="3" appearance="outlined" mode="multiple">
        <wa-accordion-item label="Why do these behind-the-scenes scenes live in Backstage instead of inside the book chapters?" expanded>
          <p>
            Every Ocean View Archives novel stays faithful to its narrator&rsquo;s lived point of view—such as Michael&rsquo;s first-person narration in <em>The Rachel Narrative</em>, Nathaniel Prairie&rsquo;s first-person perspective in <em>Katie &amp; Nathaniel</em>, or Jordan&rsquo;s close third-person point of view in <em>The Eleventh Child</em>. Housing hallway briefings, closed-door meetings, and staff dispatches inside <strong>RaggieSoft Backstage</strong> protects chapter immersion while rewarding curious readers with the full story behind the curtain.
          </p>
        </wa-accordion-item>
        <wa-accordion-item label="How do Backstage bonus features work while reading on RaggieSoft Book Reader?">
          <p>
            Whenever a chapter on <a href="https://books.raggiesoft.com" class="bs-link">RaggieSoft Book Reader</a> has a companion dossier, a <strong>Behind the Scenes / Bonus Feature</strong> card appears at the end of the chapter. Selecting it opens the dossier right inside your reading view without losing your spot—or you can explore the complete archive directly here on <strong>RaggieSoft Backstage</strong>.
          </p>
        </wa-accordion-item>
        <wa-accordion-item label="Can I install RaggieSoft Backstage as an app or customize the reading look?">
          <p>
            Yes! Select <strong>Install App</strong> in the top bar (or <strong>Share → Add to Home Screen</strong> on iPhone and iPad) to install <strong>RaggieSoft Backstage</strong> alongside <strong>RaggieSoft Book Reader</strong> and <strong>The Listening Room</strong> with offline access across all ${counts.total} records. Select <strong>Appearance</strong> at any time to switch between Light, Dark, or device-matched lighting, five distinct visual styles, and four editorial color palettes.
          </p>
        </wa-accordion-item>
      </wa-accordion>
    </section>

    <script id="bs-archive-dataset" type="application/json">${safeJsonForScript(ledgerRows)}</script>
  `;

  return renderBackstageShell({
    title: 'RaggieSoft Backstage | Bonus Features & Lore Archive',
    description:
      'Official behind-the-scenes bonus features, Rachel & Katie companion dossiers, CPI campus guide, and correspondence archive for RaggieSoft Books and Music.',
    canonicalPath: '/',
    ogImage: `${OG_CDN_BASE}/backstage-hub-og.jpg`,
    ogImageAlt:
      'RaggieSoft Backstage — Illustrated 2x2 showcase featuring Bear and Bug Sanctuary, Katie and Nate in the U.S. Senate, CPI Preston Hall, and Ashley Raybourn with Bonnie Reed.',
    counts,
    bodyHtml
  });
}

/**
 * Generates `/manifest.json` and `/sw.js` for the RaggieSoft Backstage PWA,
 * achieving full installable parity with RaggieSoft Book Reader & The Listening Room.
 */
function buildPwaAssets(items) {
  const manifest = {
    id: '/',
    name: 'RaggieSoft Backstage — Bonus Features & Story Companion Archive',
    short_name: 'Backstage',
    description:
      'Immersive behind-the-scenes bonus features, The Rachel Narrative & Katie & Nathaniel dossiers, and Commonwealth Polytechnic Institute (CPI) campus guide for RaggieSoft Books and Music.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'any',
    background_color: '#070b14',
    theme_color: '#861f41',
    categories: ['books', 'entertainment', 'music'],
    icons: [
      {
        src: `/icons/icon-192.png?v=${ASSET_VERSION}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `/icons/icon-512.png?v=${ASSET_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `/icons/manifest-icon-192.maskable.png?v=${ASSET_VERSION}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: `/icons/manifest-icon-512.maskable.png?v=${ASSET_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'The Rachel Narrative',
        short_name: 'Rachel',
        description: 'Bear & Bug sanctuary dossiers and Ashley & Bonnie’s 1999 briefing',
        url: '/books/rachel',
        icons: [{ src: `/icons/icon-192.png?v=${ASSET_VERSION}`, sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Katie & Nathaniel',
        short_name: 'Katie & Nate',
        description: 'Tidewater, Capitol Square, and U.S. Senate companion dossiers',
        url: '/books/katie',
        icons: [{ src: `/icons/icon-192.png?v=${ASSET_VERSION}`, sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'The Eleventh Child',
        short_name: 'Eleventh Child',
        description: 'Suite 214/216 dossiers and CPI administrative dispatches',
        url: '/books/aubrie',
        icons: [{ src: `/icons/icon-192.png?v=${ASSET_VERSION}`, sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'CPI Campus Guide',
        short_name: 'CPI Campus',
        description: 'Commonwealth Polytechnic Institute architecture & Poly Pass transit',
        url: '/locations/cpi',
        icons: [{ src: `/icons/icon-192.png?v=${ASSET_VERSION}`, sizes: '192x192', type: 'image/png' }]
      }
    ]
  };

  const preCacheUrls = [
    '/',
    '/manifest.json',
    `/favicon.ico?v=${ASSET_VERSION}`,
    `/icons/icon.svg?v=${ASSET_VERSION}`,
    `/icons/icon-192.png?v=${ASSET_VERSION}`,
    `/icons/icon-512.png?v=${ASSET_VERSION}`,
    `/icons/apple-icon-180.png?v=${ASSET_VERSION}`,
    `/assets/backstage.css?v=${ASSET_VERSION}`,
    `/assets/backstage-client.js?v=${ASSET_VERSION}`,
    '/api/v1/index.json',
    ...items.map((i) => i.routePath),
    ...items.map((i) => `/api/v1/${i.slug}.json`)
  ];

  const swJs = `/**
 * @license MIT
 * ============================================================================
 * sw.js — Tiered Progressive Web App Service Worker for backstage.raggiesoft.com
 * ============================================================================
 * Caching Strategy:
 * 1. HTML Navigations (\`request.mode === 'navigate'\`): NetworkFirst (always
 *    serves the freshest application shell online, falling back to cache offline).
 * 2. JSON Companion API (\`/api/v1/*.json\`): StaleWhileRevalidate.
 * 3. Versioned Same-Origin Assets (\`/assets/*\`, \`/icons/*\`): CacheFirst.
 * ============================================================================
 */
const CACHE_NAME = 'raggiesoft-backstage-v${ASSET_VERSION}';
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
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname === '/robots.txt' ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/404.html' ||
    url.pathname.endsWith('.txt')
  ) {
    return;
  }

  // 1. HTML Documents: NetworkFirst for instant content freshness + offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // 2. JSON Companion API: StaleWhileRevalidate
  if (url.pathname.startsWith('/api/v1/')) {
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
    return;
  }

  // 3. Static Versioned Assets & Icons: CacheFirst
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
`;

  writeDistFile('manifest.json', JSON.stringify(manifest, null, 2));
  writeDistFile('sw.js', swJs);
}

/**
 * Executes the full RaggieSoft Backstage static site, PWA & JSON API build.
 */
function buildBackstageSite() {
  const items = loadBackstageItems();
  const groups = computeArchiveGroups(items);

  // 0. Clean stale dist output and copy static PWA icons/favicon from `public/`
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  copyDirectoryRecursive(publicDir, distDir);

  // 1. Write CSS, Client JS, and PWA Manifest / Service Worker
  writeDistFile('assets/backstage.css', buildBackstageCss());
  writeDistFile('assets/backstage-client.js', buildBackstageClientJs());
  buildPwaAssets(items);

  // 2. Write Home Page (`/index.html`)
  writeDistFile('index.html', renderHomePage(items, groups));

  // 3. Write each item route (`/<slug>/index.html`) and JSON API (`/api/v1/<slug>.json`)
  const apiIndex = {
    generatedAt: new Date().toISOString(),
    siteName: 'RaggieSoft Backstage',
    baseUrl: 'https://backstage.raggiesoft.com',
    totalItems: items.length,
    counts: groups.counts,
    items: {}
  };

  const sharedAssetsRoot = path.resolve(projectRoot, '../../../raggiesoft-assets/raggiesoft-backstage/api/v1');
  const canMirrorToAssets = fs.existsSync(path.resolve(projectRoot, '../../../raggiesoft-assets'));

  for (const item of items) {
    const htmlPage = renderItemPage(item, items, groups);
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
      image: item.image,
      imageAlt: item.imageAlt,
      ogImage: item.ogImage,
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
      image: item.image,
      ogImage: item.ogImage,
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

  // 4. Generate 404.html, sitemap.xml, robots.txt, and IndexNow key
  writeDistFile(
    '404.html',
    renderBackstageShell({
      title: 'Page Not Found | RaggieSoft Backstage',
      description: 'The requested Backstage correspondence or companion dossier could not be found.',
      canonicalPath: '/404',
      noindex: true,
      counts: groups.counts,
      bodyHtml: `
        <div class="bs-hero">
          <div class="bs-badge-strip">
            <wa-badge variant="brand" appearance="filled" pill>
              <wa-icon family="duotone" name="clapperboard-play" aria-hidden="true"></wa-icon>&nbsp;Page Not Found
            </wa-badge>
          </div>
          <h1 class="bs-title">We Could Not Find That Backstage Record</h1>
          <p class="bs-subtitle">
            The bonus correspondence, campus guide, or companion dossier you followed may have moved. Explore our collections below or return to the books and music hubs.
          </p>
          <div class="bs-action-row">
            <wa-button variant="brand" href="/">
              <wa-icon slot="start" family="duotone" name="film" aria-hidden="true"></wa-icon>
              Backstage Hub (${groups.counts.total})
            </wa-button>
            <wa-button variant="neutral" appearance="outlined" href="/books/rachel">
              <wa-icon slot="start" family="duotone" name="shield-heart" aria-hidden="true"></wa-icon>
              The Rachel Narrative (${groups.counts.rachelDossiers})
            </wa-button>
            <wa-button variant="neutral" appearance="outlined" href="/books/katie">
              <wa-icon slot="start" family="duotone" name="wheelchair-move" aria-hidden="true"></wa-icon>
              Katie &amp; Nathaniel (${groups.counts.katieDossiers})
            </wa-button>
            <wa-button variant="neutral" appearance="outlined" href="/books/aubrie">
              <wa-icon slot="start" family="duotone" name="book-sparkles" aria-hidden="true"></wa-icon>
              The Eleventh Child (${groups.counts.aubrieDossiers})
            </wa-button>
            <wa-button variant="neutral" appearance="outlined" href="https://books.raggiesoft.com">
              <wa-icon slot="start" family="duotone" name="book-open-cover" aria-hidden="true"></wa-icon>
              RaggieSoft Book Reader ↗
            </wa-button>
          </div>
        </div>`
    })
  );

  const today = new Date().toISOString().split('T')[0];
  const urls = ['https://backstage.raggiesoft.com/', ...items.map((i) => i.canonicalUrl)];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${escapeHtml(u)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
    .join('\n')}\n</urlset>\n`;
  writeDistFile('sitemap.xml', sitemapXml);
  writeDistFile(
    'robots.txt',
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://backstage.raggiesoft.com/sitemap.xml\n`
  );
  writeDistFile('726167676965736f6674696e6465786e.txt', '726167676965736f6674696e6465786e\n');

  console.log(
    `✅ Built backstage.raggiesoft.com Web Awesome Pro 3.13.0 (<wa-page>) + Font Awesome Pro+ PWA bundle in ${distDir} (${items.length} live Backstage records compiled).`
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
      filePath = path.join(distDir, '404.html');
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
              : ext === '.svg'
                ? 'image/svg+xml'
                : ext === '.png'
                  ? 'image/png'
                  : ext === '.ico'
                    ? 'image/x-icon'
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
