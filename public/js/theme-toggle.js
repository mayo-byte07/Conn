/* ═══════════════════════════════════════════════════════════
   CONN — Dark / Light Mode Toggle
   Placement: inside .navbar-links, after the Team link
   Persisted via localStorage under key 'conn-color-mode'
   ═══════════════════════════════════════════════════════════ */

(function () {
  var STORAGE_KEY = 'conn-color-mode';

  /* ── 1. Apply saved preference before first paint (FOUC guard) ── */
  if (localStorage.getItem(STORAGE_KEY) === 'light') {
    document.documentElement.classList.add('light-mode');
  }

  /* ── 2. Sync every .theme-toggle-btn on the page ── */
  function syncButtons() {
    var isLight = document.documentElement.classList.contains('light-mode');
    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      btn.setAttribute('title',      isLight ? 'Switch to dark mode' : 'Switch to light mode');
      var moon = btn.querySelector('.toggle-icon-moon');
      var sun  = btn.querySelector('.toggle-icon-sun');
      if (moon) moon.style.opacity = isLight ? '0' : '1';
      if (sun)  sun.style.opacity  = isLight ? '1' : '0';
    });
  }

  /* ── 3. Toggle handler ── */
  function toggleMode() {
    var isLight = document.documentElement.classList.toggle('light-mode');
    localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark');
    syncButtons();
  }

  /* ── 4. Wire up every .theme-toggle-btn after DOM is ready ── */
  function init() {
    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
      if (btn.dataset.toggleBound) return;
      btn.dataset.toggleBound = 'true';
      btn.addEventListener('click', toggleMode);
    });
    syncButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();