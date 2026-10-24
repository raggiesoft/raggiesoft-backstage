/**
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
