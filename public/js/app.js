/* ═══════════════════════════════════════════════════════════
   CONN — Public Page Application Logic
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Detect View Mode ───
  // If URL is /u/:username → public profile (fetch from /api/u/:username/*)
  // If URL is /me → authenticated user's own page (fetch from /api/*)
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const isPublicProfile = pathParts[0] === 'u' && pathParts[1];
  const profileUsername = isPublicProfile ? pathParts[1] : null;

  function apiUrl(endpoint) {
    if (isPublicProfile) {
      return `/api/u/${profileUsername}${endpoint}`;
    }
    return `/api${endpoint}`;
  }

  // ─── Social Icons SVGs ───
  const SOCIAL_ICONS = {
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
  };

  // ─── Theme Color Map (for particle canvas) ───
  const THEME_COLORS = {
    'midnight': '168, 85, 247',
    'neon-cyber': '6, 182, 212',
    'sunset-blaze': '249, 115, 22',
    'forest-dusk': '34, 197, 94',
    'ocean-deep': '14, 165, 233',
    'rose-gold': '244, 63, 94',
    'arctic-frost': '148, 163, 184',
    'lava-flow': '239, 68, 68',
    'vaporwave': '217, 70, 239',
    'monochrome': '163, 163, 163',
    'galaxy': '129, 140, 248',
    'emerald-matrix': '16, 185, 129',
    'aurora-borealis': '52, 211, 153',
    'cosmic-nebula': '168, 85, 247',
    'tropical-paradise': '56, 178, 172',
    'midnight-oil': '99, 102, 241',
    'cotton-candy': '236, 72, 153',
    'emerald-aurora': '16, 185, 129',
    'holographic': '167, 139, 250',
    'molten-lava': '249, 115, 22'
  };

  let currentThemeColor = '168, 85, 247';

  // ─── Load Settings & Apply Theme ───
  async function loadSettings() {
    try {
      const res = await fetch(apiUrl('/settings'));
      if (!res.ok) {
        // If not authenticated for /me, fall back gracefully
        if (!isPublicProfile) return;
        throw new Error('Failed to load settings');
      }
      const settings = await res.json();

      // Apply theme
      const theme = settings.selectedTheme || 'midnight';
      document.body.className = `theme-${theme}`;
      currentThemeColor = THEME_COLORS[theme] || '168, 85, 247';

      // Update page title
      if (settings.pageTitle) document.title = settings.pageTitle;

      // Verified badge visibility
      const badge = document.getElementById('verifiedBadge');
      if (badge && settings.showVerifiedBadge === false) badge.style.display = 'none';

      // Footer visibility
      const footer = document.getElementById('pageFooter');
      if (footer && settings.showFooter === false) footer.style.display = 'none';

      // Custom CSS
      if (settings.customCSS) {
        const style = document.createElement('style');
        style.textContent = settings.customCSS;
        document.head.appendChild(style);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  // ─── Particle Canvas ───
  function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        pulse: Math.random() * Math.PI * 2
      };
    }

    function init() {
      resize();
      particles = [];
      const count = Math.min(60, Math.floor((w * h) / 20000));
      for (let i = 0; i < count; i++) particles.push(createParticle());
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.01;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${currentThemeColor}, ${a})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${currentThemeColor}, ${0.03 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); });
    init();
    draw();
  }

  // ─── Ripple Effect ───
  function addRipple(e, el) {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'link-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  // ─── Render Profile ───
  async function renderProfile() {
    try {
      const res = await fetch(apiUrl('/profile'));
      if (!res.ok) {
        // If not authenticated for /me, show login prompt
        if (!isPublicProfile) {
          document.getElementById('profileName').textContent = 'Sign in to view';
          return;
        }
        throw new Error('Failed to load profile');
      }
      const profile = await res.json();

      document.getElementById('profileName').textContent = profile.name || 'Your Name';
      document.getElementById('profileBio').textContent = profile.bio || '';

      // Avatar
      const avatarEl = document.getElementById('avatarEl');
      if (profile.avatar) {
        avatarEl.innerHTML = `<img src="${profile.avatar}" alt="${profile.name}" />`;
      } else {
        const initials = (profile.name || 'C').charAt(0).toUpperCase();
        avatarEl.innerHTML = `<div class="avatar-placeholder">${initials}</div>`;
      }

      // Socials
      const socialsRow = document.getElementById('socialsRow');
      socialsRow.innerHTML = '';
      if (profile.socials) {
        Object.entries(profile.socials).forEach(([platform, url]) => {
          if (!url || !SOCIAL_ICONS[platform]) return;
          const finalUrl = platform === 'email' ? `mailto:${url}` : url;
          const btn = document.createElement('a');
          btn.href = finalUrl;
          btn.target = platform !== 'email' ? '_blank' : '';
          btn.rel = 'noopener noreferrer';
          btn.className = 'social-icon-btn';
          btn.title = platform.charAt(0).toUpperCase() + platform.slice(1);
          btn.innerHTML = SOCIAL_ICONS[platform];
          socialsRow.appendChild(btn);
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  // ─── Render Links ───
  async function renderLinks() {
    try {
      const res = await fetch(apiUrl('/links'));
      if (!res.ok) {
        if (!isPublicProfile) return; // Not logged in for /me
        throw new Error('Failed to load links');
      }
      const links = await res.json();

      const container = document.getElementById('linksContainer');
      container.innerHTML = '';

      // For authenticated /api/links, filter active; for public, already filtered by server
      const activeLinks = isPublicProfile ? links : links.filter(l => l.active);

      activeLinks.forEach((link, i) => {
        const card = document.createElement('a');
        card.href = link.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = 'link-card' + (link.style === 'featured' ? ' featured' : '');
        card.style.animationDelay = `${0.25 + i * 0.1}s`;

        card.innerHTML = `
          <div class="link-card-icon">${link.title.match(/^\p{Emoji}/u)?.[0] || '🔗'}</div>
          <div class="link-card-content">
            <div class="link-card-title">${escapeHtml(link.title.replace(/^\p{Emoji}\s*/u, ''))}</div>
          </div>
          <div class="link-card-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        `;

        // Track click — use the correct endpoint based on view mode
        card.addEventListener('click', (e) => {
          addRipple(e, card);
          const clickUrl = isPublicProfile
            ? `/api/u/${profileUsername}/links/${link.id}/click`
            : `/api/links/${link.id}/click`;
          fetch(clickUrl, { method: 'POST' }).catch(() => {});
        });

        container.appendChild(card);
      });
    } catch (err) {
      console.error('Failed to load links:', err);
    }
  }

  // ─── Utility ───
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    initParticles();
    renderProfile();
    renderLinks();
  });
})();
