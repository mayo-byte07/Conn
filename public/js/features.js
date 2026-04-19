/* ═══════════════════════════════════════════════════════════
   CONN — Feature Pages Shared JS
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── Scroll Reveal ───
  function initScrollReveal() {
    const els = document.querySelectorAll('.feat-animate');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    els.forEach(el => observer.observe(el));
  }

  // ─── Navbar ───
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
      closeMegaDropdown();
    });
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (btn && menu) {
      btn.addEventListener('click', () => menu.classList.toggle('open'));
      menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => menu.classList.remove('open'));
      });
    }
    // Mobile product accordion
    const mpt = document.getElementById('mobileProductToggle');
    const mpp = document.getElementById('mobileProductPanel');
    if (mpt && mpp) {
      mpt.addEventListener('click', () => {
        mpt.classList.toggle('open');
        mpp.classList.toggle('open');
      });
      mpp.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          if (menu) menu.classList.remove('open');
          mpt.classList.remove('open');
          mpp.classList.remove('open');
        });
      });
    }
  }

  // ─── Mega Dropdown ───
  function initMegaDropdown() {
    const dropdown = document.getElementById('navDropdown');
    const trigger = document.getElementById('navDropdownTrigger');
    const megaPanel = document.getElementById('megaDropdown');
    if (!dropdown || !trigger || !megaPanel) return;
    let hoverTimeout = null, isOpen = false;

    function openDD() { clearTimeout(hoverTimeout); dropdown.classList.add('open'); isOpen = true; }
    function closeDD(d) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => { dropdown.classList.remove('open'); isOpen = false; }, d || 200);
    }

    dropdown.addEventListener('mouseenter', () => { if (window.innerWidth > 768) openDD(); });
    dropdown.addEventListener('mouseleave', () => { if (window.innerWidth > 768) closeDD(250); });
    megaPanel.addEventListener('mouseenter', () => { if (window.innerWidth > 768) clearTimeout(hoverTimeout); });
    megaPanel.addEventListener('mouseleave', () => { if (window.innerWidth > 768) closeDD(250); });
    trigger.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); isOpen ? closeDD(0) : openDD(); });
    document.addEventListener('click', (e) => { if (isOpen && !dropdown.contains(e.target) && !megaPanel.contains(e.target)) { dropdown.classList.remove('open'); isOpen = false; } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) { dropdown.classList.remove('open'); isOpen = false; } });
    megaPanel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { dropdown.classList.remove('open'); isOpen = false; }));
  }

  function closeMegaDropdown() {
    const d = document.getElementById('navDropdown');
    if (d) d.classList.remove('open');
  }

  // ─── Auth State ───
  function initAuthState() {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => {
        const ng = document.getElementById('navGuest'), na = document.getElementById('navAuth');
        const mg = document.getElementById('mobileGuest'), ma = document.getElementById('mobileAuth');
        if (data.authenticated) {
          if (na) na.style.display = 'flex';
          if (ng) ng.style.display = 'none';
          if (ma) ma.style.display = 'block';
          if (mg) mg.style.display = 'none';
        } else {
          if (ng) ng.style.display = 'flex';
          if (na) na.style.display = 'none';
          if (mg) mg.style.display = 'block';
          if (ma) ma.style.display = 'none';
        }
      })
      .catch(() => {
        const ng = document.getElementById('navGuest'), mg = document.getElementById('mobileGuest');
        if (ng) ng.style.display = 'flex';
        if (mg) mg.style.display = 'block';
      });
  }

  // ─── Smooth Scroll ───
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ─── Tilt ───
  function initTilt() {
    if (typeof VanillaTilt !== 'undefined') {
      VanillaTilt.init(document.querySelectorAll('.feat-visual-card, .feat-cross-card'), {
        max: 6, speed: 400, glare: true, 'max-glare': 0.1, scale: 1.01
      });
    }
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initNavbar();
    initMegaDropdown();
    initAuthState();
    initSmoothScroll();
    initTilt();
  });
})();
