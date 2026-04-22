/* ═══════════════════════════════════════════════════════════
   CONN — Admin Dashboard Logic
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let currentEditId = null;
  let selectedTheme = 'midnight';

  // ─── Theme Definitions ───
  const THEMES = [
    { id: 'midnight',       name: 'Midnight',        tag: 'Default',  bg: 'linear-gradient(135deg, #0a0a0a, #1a0a2e, #0a0a0a)',   colors: ['#a855f7','#c084fc','#f5f5f5'] },
    { id: 'neon-cyber',     name: 'Neon Cyber',      tag: 'Electric', bg: 'linear-gradient(135deg, #020617, #0c1222, #020617)',   colors: ['#06b6d4','#ec4899','#e0f2fe'] },
    { id: 'sunset-blaze',   name: 'Sunset Blaze',    tag: 'Warm',     bg: 'linear-gradient(135deg, #1a0a00, #2d1400, #1a0a00)',   colors: ['#f97316','#fbbf24','#fff7ed'] },
    { id: 'forest-dusk',    name: 'Forest Dusk',     tag: 'Natural',  bg: 'linear-gradient(135deg, #021a09, #04260e, #021a09)',   colors: ['#22c55e','#4ade80','#f0fdf4'] },
    { id: 'ocean-deep',     name: 'Ocean Deep',      tag: 'Cool',     bg: 'linear-gradient(135deg, #001a2c, #002844, #001a2c)',   colors: ['#0ea5e9','#38bdf8','#e0f2fe'] },
    { id: 'rose-gold',      name: 'Rose Gold',       tag: 'Elegant',  bg: 'linear-gradient(135deg, #1a0a10, #2d1520, #1a0a10)',   colors: ['#f43f5e','#fda4af','#fbbf24'] },
    { id: 'arctic-frost',   name: 'Arctic Frost',    tag: 'Minimal',  bg: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)',   colors: ['#94a3b8','#e2e8f0','#f8fafc'] },
    { id: 'lava-flow',      name: 'Lava Flow',       tag: 'Intense',  bg: 'linear-gradient(135deg, #1a0000, #2d0a00, #1a0000)',   colors: ['#ef4444','#f97316','#fef2f2'] },
    { id: 'vaporwave',      name: 'Vaporwave',       tag: 'Retro',    bg: 'linear-gradient(135deg, #1a0026, #0a0033, #1a0026)',   colors: ['#d946ef','#8b5cf6','#fde68a'] },
    { id: 'monochrome',     name: 'Monochrome',      tag: 'Classic',  bg: 'linear-gradient(135deg, #0a0a0a, #171717, #0a0a0a)',   colors: ['#a3a3a3','#d4d4d4','#fafafa'] },
    { id: 'galaxy',         name: 'Galaxy',          tag: 'Cosmic',   bg: 'linear-gradient(135deg, #0a001a, #150030, #0a0033)',   colors: ['#818cf8','#a78bfa','#c4b5fd'] },
    { id: 'emerald-matrix', name: 'Emerald Matrix',  tag: 'Hacker',   bg: 'linear-gradient(135deg, #001a00, #002200, #001a00)',   colors: ['#10b981','#34d399','#d1fae5'] },
    { id: 'botanical',      name: 'Botanical',       tag: 'Organic',  bg: '#0a2e20',                                              colors: ['#0a2e20','#d4f7e2','#bcedcc'] },
    { id: 'minimal-light',  name: 'Minimal Light',   tag: 'Clean',    bg: '#f0f2f5',                                              colors: ['#111827','#ffffff','#f9fafb'] },
    { id: 'muddy-texture',  name: 'Muddy Texture',   tag: 'Earthy',   bg: '#4a3b32',                                              colors: ['#f5eedc','rgba(255,255,255,0.4)','transparent'] },
    { id: 'wavy-purple',    name: 'Wavy Purple',     tag: 'Playful',  bg: 'radial-gradient(circle at top left, #a78bfa 0%, #7c3aed 100%)', colors: ['#ffffff','#ede9fe','#8b5cf6'] },
    { id: 'retro-shadow',   name: 'Retro Shadow',    tag: 'Brutalist',bg: '#e8e1cc',                                              colors: ['#171717','#ffffff','#fcfcfc'] },
    { id: 'sunset-mesh',    name: 'Sunset Mesh',     tag: 'Vibrant',  bg: 'radial-gradient(circle at top left, #10b981 0%, #ef4444 100%)', colors: ['#ffffff','#ffffff','#f1f5f9'] },
    // ── Gradient Themes ──
    { id: 'aurora-borealis',    name: 'Aurora Borealis',    tag: 'Gradient',   bg: 'linear-gradient(135deg, #020b18 0%, #0a3d2e 30%, #1a1a5e 70%, #020b18 100%)', colors: ['#34d399','#818cf8','#06b6d4'] },
    { id: 'cosmic-nebula',      name: 'Cosmic Nebula',      tag: 'Gradient',   bg: 'linear-gradient(135deg, #0a0015 0%, #3d1566 30%, #661535 70%, #0a0015 100%)', colors: ['#a855f7','#f43f5e','#ec4899'] },
    { id: 'tropical-paradise',  name: 'Tropical Paradise',  tag: 'Gradient',   bg: 'linear-gradient(135deg, #001a1a 0%, #0a4040 30%, #3d2e0a 70%, #001a1a 100%)', colors: ['#38b2ac','#f6ad55','#48bb78'] },
    { id: 'midnight-oil',       name: 'Midnight Oil',       tag: 'Gradient',   bg: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a5e 30%, #3d1e0a 70%, #0c0c1d 100%)', colors: ['#6366f1','#fb923c','#4f46e5'] },
    { id: 'cotton-candy',       name: 'Cotton Candy',       tag: 'Gradient',   bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #ede9fe 70%, #fdf2f8 100%)', colors: ['#ec4899','#8b5cf6','#f472b6'] },
    { id: 'emerald-aurora',     name: 'Emerald Aurora',     tag: 'Gradient',   bg: 'linear-gradient(135deg, #021a12 0%, #0a4030 30%, #0a2e40 70%, #021a12 100%)', colors: ['#10b981','#06b6d4','#34d399'] },
    { id: 'holographic',        name: 'Holographic',        tag: 'Gradient',   bg: 'linear-gradient(135deg, #0a0a12 0%, #2d1b69 25%, #0a3d4d 50%, #3d1035 75%, #0a0a12 100%)', colors: ['#a78bfa','#22d3ee','#f472b6'] },
    { id: 'molten-lava',        name: 'Molten Lava',        tag: 'Gradient',   bg: 'linear-gradient(135deg, #120800 0%, #4d1a00 30%, #4d0a0a 70%, #120800 100%)', colors: ['#f97316','#ef4444','#fbbf24'] },
  ];

  // ─── Navigation ───
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.admin-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      sections.forEach(s => s.classList.remove('active'));
      document.getElementById('section' + capitalize(target)).classList.add('active');
      document.getElementById('adminSidebar').classList.remove('open');

      if (target === 'analytics') loadAnalytics();
      if (target === 'profile') loadProfile();
      if (target === 'links') loadLinks();
      if (target === 'themes') loadThemes();
      if (target === 'settings') loadSettingsData();
    });
  });

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
  });

  // ─── Toast ───
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconSvg = type === 'success'
      ? '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      : '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    toast.innerHTML = iconSvg + `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ═══════════ LINKS ═══════════

  async function loadLinks() {
    try {
      const res = await fetch('/api/links');
      const links = await res.json();
      renderAdminLinks(links);
    } catch (err) {
      showToast('Failed to load links', 'error');
    }
  }

  function renderAdminLinks(links) {
    const list = document.getElementById('adminLinksList');

    // Show link count badge
    const headerActions = document.querySelector('#sectionLinks .admin-header-actions');
    let badge = headerActions.querySelector('.link-count-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'link-count-badge';
      headerActions.insertBefore(badge, headerActions.firstChild);
    }
    badge.textContent = `${links.length} links`;

    if (links.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <h3>No links yet</h3>
          <p>Click "Add Link" to create your first link.</p>
        </div>`;
      return;
    }

    list.innerHTML = links.map(link => `
      <div class="admin-link-item ${!link.active ? 'inactive' : ''}" data-id="${link.id}">
        <div class="drag-handle" title="Drag to reorder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/>
            <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
            <circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/>
          </svg>
        </div>
        <div class="admin-link-info">
          <div class="admin-link-title">${escapeHtml(link.title)}</div>
          <div class="admin-link-url">${escapeHtml(link.url)}</div>
        </div>
        <div class="admin-link-clicks">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${link.clicks || 0}
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${link.active ? 'checked' : ''} onchange="window.adminApp.toggleLink('${link.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
        <div class="admin-link-actions">
          <button class="btn btn-icon btn-secondary" onclick="window.adminApp.editLink('${link.id}')" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-icon btn-danger" onclick="window.adminApp.deleteLink('${link.id}')" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    setupDragAndDrop();
  }

  // ─── Drag & Drop ───
  function setupDragAndDrop() {
    const list = document.getElementById('adminLinksList');
    const items = list.querySelectorAll('.admin-link-item');
    let dragItem = null;

    items.forEach(item => {
      const handle = item.querySelector('.drag-handle');
      handle.addEventListener('mousedown', () => {
        dragItem = item;
        item.style.opacity = '0.5';
      });
    });

    document.addEventListener('mouseup', async () => {
      if (dragItem) {
        dragItem.style.opacity = '1';
        dragItem = null;
        const ids = [...list.querySelectorAll('.admin-link-item')].map(i => i.dataset.id);
        try {
          await fetch('/api/links-reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderedIds: ids })
          });
          reloadPreview();
        } catch (err) {
          showToast('Failed to save order', 'error');
        }
      }
    });

    list.addEventListener('mousemove', (e) => {
      if (!dragItem) return;
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement) {
        list.insertBefore(dragItem, afterElement);
      } else {
        list.appendChild(dragItem);
      }
    });
  }

  function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('.admin-link-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // ─── Modal ───
  const modal = document.getElementById('linkModal');

  function openModal(title = 'Add Link', data = {}) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalLinkTitle').value = data.title || '';
    document.getElementById('modalLinkUrl').value = data.url || '';
    currentEditId = data.id || null;
    modal.classList.add('active');
    setTimeout(() => document.getElementById('modalLinkTitle').focus(), 300);
  }

  function closeModal() {
    modal.classList.remove('active');
    currentEditId = null;
  }

  document.getElementById('addLinkBtn').addEventListener('click', () => {
    openModal('Add Link');
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('modalSaveBtn').addEventListener('click', async () => {
    const title = document.getElementById('modalLinkTitle').value.trim();
    const url = document.getElementById('modalLinkUrl').value.trim();
    if (!title || !url) { showToast('Please fill in both title and URL', 'error'); return; }

    try {
      if (currentEditId) {
        await fetch(`/api/links/${currentEditId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, url })
        });
        showToast('Link updated!');
      } else {
        await fetch('/api/links', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, url })
        });
        showToast('Link added!');
      }
      closeModal();
      loadLinks();
      reloadPreview();
    } catch (err) {
      showToast('Failed to save link', 'error');
    }
  });

  // ═══════════ PROFILE ═══════════

  async function loadProfile() {
    try {
      const res = await fetch('/api/profile');
      const profile = await res.json();
      document.getElementById('inputName').value = profile.name || '';
      document.getElementById('inputBio').value = profile.bio || '';
      document.getElementById('inputAvatar').value = profile.avatar || '';
      if (profile.socials) {
        document.getElementById('socialTwitter').value = profile.socials.twitter || '';
        document.getElementById('socialInstagram').value = profile.socials.instagram || '';
        document.getElementById('socialGithub').value = profile.socials.github || '';
        document.getElementById('socialLinkedin').value = profile.socials.linkedin || '';
        document.getElementById('socialYoutube').value = profile.socials.youtube || '';
        document.getElementById('socialTiktok').value = profile.socials.tiktok || '';
        document.getElementById('socialEmail').value = profile.socials.email || '';
      }
    } catch (err) {
      showToast('Failed to load profile', 'error');
    }
  }

  document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    const data = {
      name: document.getElementById('inputName').value.trim(),
      bio: document.getElementById('inputBio').value.trim(),
      avatar: document.getElementById('inputAvatar').value.trim(),
      socials: {
        twitter: document.getElementById('socialTwitter').value.trim(),
        instagram: document.getElementById('socialInstagram').value.trim(),
        github: document.getElementById('socialGithub').value.trim(),
        linkedin: document.getElementById('socialLinkedin').value.trim(),
        youtube: document.getElementById('socialYoutube').value.trim(),
        tiktok: document.getElementById('socialTiktok').value.trim(),
        email: document.getElementById('socialEmail').value.trim()
      }
    };
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      showToast('Profile saved!');
      reloadPreview();
    } catch (err) {
      showToast('Failed to save profile', 'error');
    }
  });

  // ═══════════ THEMES ═══════════

  async function loadThemes() {
    // Get current theme from settings
    try {
      const res = await fetch('/api/settings');
      const settings = await res.json();
      selectedTheme = settings.selectedTheme || 'midnight';
    } catch (err) {}

    renderThemePicker();
  }

  function renderThemePicker() {
    const grid = document.getElementById('themePickerGrid');

    grid.innerHTML = THEMES.map(theme => {
      return `
      <div class="theme-pick-card ${theme.id === selectedTheme ? 'selected' : ''}" data-theme="${theme.id}" onclick="window.adminApp.selectTheme('${theme.id}')">
        <div class="theme-pick-swatch" style="background: ${theme.bg}">
          <div class="mini-mock">
            <div class="mini-mock-avatar" style="background: linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})"></div>
            <div class="mini-mock-lines">
              <div class="mini-mock-line"></div>
              <div class="mini-mock-line"></div>
              <div class="mini-mock-line"></div>
            </div>
          </div>
        </div>
        <div class="theme-pick-info">
          <span class="theme-pick-name">${theme.name}</span>
          <span class="theme-pick-tag">${theme.tag}</span>
        </div>
        <div class="theme-pick-colors">
          ${theme.colors.map(c => `<div class="theme-pick-dot" style="background:${c}"></div>`).join('')}
        </div>
      </div>
    `;}).join('');
  }

  // Save theme
  document.getElementById('saveThemeBtn').addEventListener('click', async () => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTheme })
      });
      showToast(`Theme "${THEMES.find(t => t.id === selectedTheme)?.name}" applied!`);
      reloadPreview();
    } catch (err) {
      showToast('Failed to save theme', 'error');
    }
  });

  // ═══════════ SETTINGS ═══════════

  async function loadSettingsData() {
    try {
      const res = await fetch('/api/settings');
      const settings = await res.json();
      document.getElementById('settingPageTitle').value = settings.pageTitle || '';
      document.getElementById('settingMetaDesc').value = settings.metaDescription || '';
      document.getElementById('settingVerifiedBadge').checked = settings.showVerifiedBadge !== false;
      document.getElementById('settingShowFooter').checked = settings.showFooter !== false;
      document.getElementById('settingCustomCSS').value = settings.customCSS || '';
    } catch (err) {
      showToast('Failed to load settings', 'error');
    }
  }

  document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const data = {
      pageTitle: document.getElementById('settingPageTitle').value.trim(),
      metaDescription: document.getElementById('settingMetaDesc').value.trim(),
      showVerifiedBadge: document.getElementById('settingVerifiedBadge').checked,
      showFooter: document.getElementById('settingShowFooter').checked,
      customCSS: document.getElementById('settingCustomCSS').value
    };
    try {
      await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      showToast('Settings saved!');
      reloadPreview();
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  });

  // ═══════════ ANALYTICS ═══════════

  async function loadAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      document.getElementById('statTotalClicks').textContent = data.totalClicks;
      document.getElementById('statTotalLinks').textContent = data.totalLinks;
      document.getElementById('statAvgClicks').textContent = data.totalLinks > 0
        ? (data.totalClicks / data.totalLinks).toFixed(1) : '0';

      const topList = document.getElementById('topLinksList');
      if (data.topLinks && data.topLinks.length > 0) {
        topList.innerHTML = data.topLinks.map((link, i) => `
          <div class="admin-link-item">
            <div class="link-card-icon" style="font-size:1.1rem; min-width:36px; text-align:center;">#${i + 1}</div>
            <div class="admin-link-info">
              <div class="admin-link-title">${escapeHtml(link.title)}</div>
              <div class="admin-link-url">${escapeHtml(link.url)}</div>
            </div>
            <div class="admin-link-clicks" style="font-size:0.9rem; font-weight:600; color:var(--accent-light);">
              ${link.clicks || 0} clicks
            </div>
          </div>
        `).join('');
      } else {
        topList.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <h3>No data yet</h3>
            <p>Analytics will appear once your links get clicks.</p>
          </div>`;
      }
    } catch (err) {
      showToast('Failed to load analytics', 'error');
    }
  }

  // ═══════════ GLOBAL ACTIONS ═══════════

  window.adminApp = {
    async editLink(id) {
      try {
        const res = await fetch('/api/links');
        const links = await res.json();
        const link = links.find(l => l.id === id);
        if (link) openModal('Edit Link', link);
      } catch (err) { showToast('Failed to load link', 'error'); }
    },

    async deleteLink(id) {
      if (!confirm('Are you sure you want to delete this link?')) return;
      try {
        await fetch(`/api/links/${id}`, { method: 'DELETE' });
        showToast('Link deleted');
        loadLinks();
        reloadPreview();
      } catch (err) { showToast('Failed to delete link', 'error'); }
    },

    async toggleLink(id, active) {
      try {
        await fetch(`/api/links/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active })
        });
        showToast(active ? 'Link enabled' : 'Link disabled');
        reloadPreview();
      } catch (err) { showToast('Failed to update link', 'error'); }
    },

    selectTheme(themeId) {
      selectedTheme = themeId;
      document.querySelectorAll('.theme-pick-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.theme === themeId);
      });
    }
  };

  // ─── Utilities ───
  function reloadPreview() {
    const iframe = document.getElementById('livePreviewIframe');
    if (iframe) {
      // Small timeout to allow backend to persist changes first before reloading iframe
      setTimeout(() => iframe.src = iframe.src, 300);
    }
  }

  function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Keyboard Shortcuts ───
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && modal.classList.contains('active')) {
      document.getElementById('modalSaveBtn').click();
    }
  });

  // ─── Auth Guard + Logout ───
  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      if (!data.authenticated) {
        window.location.href = '/login';
      }
    } catch (err) {
      window.location.href = '/login';
    }
  }

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      showToast('Failed to sign out', 'error');
    }
  });

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    loadLinks();
    loadProfile();
  });
})();
