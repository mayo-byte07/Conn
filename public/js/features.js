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
    initTilt();
  });
})();
