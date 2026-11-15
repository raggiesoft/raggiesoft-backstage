/**
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
    var pwaSuffix =
      root.getAttribute('data-pwa') === 'standalone' ||
      root.classList.contains('is-pwa-standalone')
        ? ' is-pwa-standalone'
        : '';
    root.className =
      'wa-theme-' +
      theme +
      ' wa-palette-' +
      palette +
      (resolved === 'dark' ? ' wa-dark' : '') +
      pwaSuffix;
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
