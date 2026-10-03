/* ═══════════════════════════════════════════════════════════
   CONN — Consolidated Navbar Interactivity
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Navbar Scroll (Sticky Opaque Transition) ───
  function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
      closeMegaDropdown();
    });
  }

  // ─── Mobile Menu Drawer ───
  function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => menu.classList.toggle('open'));

    // Close menu when clicking standard links
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => menu.classList.remove('open'));
    });

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
          menu.classList.remove('open');
          mpt.classList.remove('open');
          mpp.classList.remove('open');
        });
      });
    }
  }

  // ─── Desktop Mega Dropdown ───
  function initMegaDropdown() {
    const dropdown = document.getElementById('navDropdown');
    const trigger = document.getElementById('navDropdownTrigger');
    const megaPanel = document.getElementById('megaDropdown');
    if (!dropdown || !trigger || !megaPanel) return;

    let hoverTimeout = null;
    let isOpen = false;

    function openDD() {
      clearTimeout(hoverTimeout);
      dropdown.classList.add('open');
      isOpen = true;
    }

    function closeDD(delay) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        dropdown.classList.remove('open');
        isOpen = false;
      }, delay || 200);
    }

    // Hover listeners
    dropdown.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) openDD();
    });
    dropdown.addEventListener('mouseleave', () => {
      if (window.innerWidth > 768) closeDD(250);
    });
    megaPanel.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) clearTimeout(hoverTimeout);
    });
    megaPanel.addEventListener('mouseleave', () => {
      if (window.innerWidth > 768) closeDD(250);
    });

    // Click toggle trigger
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        dropdown.classList.remove('open');
        isOpen = false;
      } else {
        openDD();
      }
    });

    // Outside clicks & Esc key
    document.addEventListener('click', (e) => {
      if (isOpen && !dropdown.contains(e.target) && !megaPanel.contains(e.target)) {
        dropdown.classList.remove('open');
        isOpen = false;
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        dropdown.classList.remove('open');
        isOpen = false;
      }
    });

    megaPanel.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        dropdown.classList.remove('open');
        isOpen = false;
      });
    });
  }

  function closeMegaDropdown() {
    const dropdown = document.getElementById('navDropdown');
    if (dropdown) dropdown.classList.remove('open');
  }

  // ─── Auth State Toggle ───
  function initAuthState() {
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        const navGuest = document.getElementById('navGuest');
        const navAuth = document.getElementById('navAuth');
        const mobileGuest = document.getElementById('mobileGuest');
        const mobileAuth = document.getElementById('mobileAuth');

        if (data.authenticated) {
          if (navAuth) navAuth.style.display = 'flex';
          if (navGuest) navGuest.style.display = 'none';
          if (mobileAuth) mobileAuth.style.display = 'block';
          if (mobileGuest) mobileGuest.style.display = 'none';
        } else {
          if (navGuest) navGuest.style.display = 'flex';
          if (navAuth) navAuth.style.display = 'none';
          if (mobileGuest) mobileGuest.style.display = 'block';
          if (mobileAuth) mobileAuth.style.display = 'none';
        }
      })
      .catch(() => {
        const navGuest = document.getElementById('navGuest');
        const mobileGuest = document.getElementById('mobileGuest');
        if (navGuest) navGuest.style.display = 'flex';
        if (mobileGuest) mobileGuest.style.display = 'block';
      });
  }

  // ─── Smart Smooth Scrolling ───
  function initSmoothScrolling() {
    document.querySelectorAll('#navbar a[href*="#"], #mobileMenu a[href*="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        const hashIndex = href.indexOf('#');
        if (hashIndex !== -1) {
          const targetId = href.substring(hashIndex); // e.g. "#themes"
          const target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Close mobile menu if open
            const menu = document.getElementById('mobileMenu');
            if (menu) menu.classList.remove('open');

            // Update URL hash
            history.pushState(null, null, targetId);
          }
        }
      });
    });
  }

  // ─── Theme Toggle Sync ───
  function initThemeToggleSync() {
    if (typeof window.initThemeToggle === 'function') {
      window.initThemeToggle();
    }
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroll();
    initMobileMenu();
    initMegaDropdown();
    initAuthState();
    initSmoothScrolling();
    initThemeToggleSync();
  });
})();
