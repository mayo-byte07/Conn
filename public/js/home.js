/* ═══════════════════════════════════════════════════════════
   CONN — Landing Page Interactivity
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Particle Canvas (reused from app.js) ───
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
      const count = Math.min(80, Math.floor((w * h) / 15000));
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
        ctx.fillStyle = `rgba(168, 85, 247, ${a})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.025 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    init();
    draw();
  }

  // ─── Scroll Reveal ───
  function initScrollReveal() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
  }

  // ─── Navbar Scroll Effect ───
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 50);
      lastY = y;
      // Close mega dropdown on scroll
      closeMegaDropdown();
    });

    // Mobile menu
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    btn.addEventListener('click', () => menu.classList.toggle('open'));

    // Close menu on link click
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => menu.classList.remove('open'));
    });

    // Mobile product accordion
    const mobileProductToggle = document.getElementById('mobileProductToggle');
    const mobileProductPanel = document.getElementById('mobileProductPanel');
    if (mobileProductToggle && mobileProductPanel) {
      mobileProductToggle.addEventListener('click', () => {
        mobileProductToggle.classList.toggle('open');
        mobileProductPanel.classList.toggle('open');
      });
      // Close accordion when a link inside is clicked
      mobileProductPanel.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          menu.classList.remove('open');
          mobileProductToggle.classList.remove('open');
          mobileProductPanel.classList.remove('open');
        });
      });
    }
  }

  // ─── Mega Dropdown Logic ───
  function initMegaDropdown() {
    const dropdown = document.getElementById('navDropdown');
    const trigger = document.getElementById('navDropdownTrigger');
    const megaPanel = document.getElementById('megaDropdown');
    if (!dropdown || !trigger || !megaPanel) return;

    let hoverTimeout = null;
    let isOpen = false;

    function openMegaDropdown() {
      clearTimeout(hoverTimeout);
      dropdown.classList.add('open');
      isOpen = true;
    }

    function closeMegaDropdownDelayed(delay) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        dropdown.classList.remove('open');
        isOpen = false;
      }, delay || 200);
    }

    // Desktop: hover with delay
    dropdown.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) openMegaDropdown();
    });

    dropdown.addEventListener('mouseleave', () => {
      if (window.innerWidth > 768) closeMegaDropdownDelayed(250);
    });

    megaPanel.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) {
        clearTimeout(hoverTimeout);
      }
    });

    megaPanel.addEventListener('mouseleave', () => {
      if (window.innerWidth > 768) closeMegaDropdownDelayed(250);
    });

    // Click toggle (works on both desktop and as fallback)
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        dropdown.classList.remove('open');
        isOpen = false;
      } else {
        openMegaDropdown();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (isOpen && !dropdown.contains(e.target) && !megaPanel.contains(e.target)) {
        dropdown.classList.remove('open');
        isOpen = false;
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        dropdown.classList.remove('open');
        isOpen = false;
      }
    });

    // Close on link click inside mega dropdown
    megaPanel.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        dropdown.classList.remove('open');
        isOpen = false;
      });
    });
  }

  // Global close function (used by scroll handler)
  function closeMegaDropdown() {
    const dropdown = document.getElementById('navDropdown');
    if (dropdown) dropdown.classList.remove('open');
  }

  // ─── Counter Animation ───
  function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target);
          animateCounter(el, 0, target, 1500);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  function animateCounter(el, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // ─── Smooth Scroll ───
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ─── Contact Form ───
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalHTML = btn.innerHTML;

      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMessage').value.trim();

      if (!name || !email || !message) return;

      btn.disabled = true;
      btn.innerHTML = '<span>Sending…</span>';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          form.style.display = 'none';
          document.getElementById('contactSuccess').style.display = 'block';
          // Reset after 5s so they can send another
          setTimeout(() => {
            form.reset();
            form.style.display = 'flex';
            document.getElementById('contactSuccess').style.display = 'none';
            btn.disabled = false;
            btn.innerHTML = originalHTML;
          }, 5000);
        } else {
          alert(data.error || 'Failed to send message. Please try again.');
          btn.disabled = false;
          btn.innerHTML = originalHTML;
        }
      } catch (err) {
        alert('Network error. Please try again.');
        btn.disabled = false;
        btn.innerHTML = originalHTML;
      }
    });
  }

  // ─── Auth State (toggle navbar buttons) ───
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
        // Fallback: show guest buttons on error
        const navGuest = document.getElementById('navGuest');
        const mobileGuest = document.getElementById('mobileGuest');
        if (navGuest) navGuest.style.display = 'flex';
        if (mobileGuest) mobileGuest.style.display = 'block';
      });
  }

  // ─── Billing Toggle (Monthly / Yearly) ───
  function initBillingToggle() {
    const toggle = document.getElementById('billingToggle');
    const monthlyLabel = document.getElementById('billingMonthlyLabel');
    const yearlyLabel = document.getElementById('billingYearlyLabel');
    const plusPrice = document.getElementById('plusPrice');
    const plusInterval = document.getElementById('plusInterval');
    const yearlyNote = document.getElementById('yearlyNote');

    const proPrice = document.getElementById('proPrice');
    const proInterval = document.getElementById('proInterval');
    const proYearlyNote = document.getElementById('proYearlyNote');

    if (!toggle) return;

    let isYearly = false;
    // Default state: monthly active
    if (monthlyLabel) monthlyLabel.classList.add('active');

    toggle.addEventListener('click', () => {
      isYearly = !isYearly;
      toggle.classList.toggle('active', isYearly);

      if (monthlyLabel) monthlyLabel.classList.toggle('active', !isYearly);
      if (yearlyLabel) yearlyLabel.classList.toggle('active', isYearly);

      if (isYearly) {
        if (plusPrice) plusPrice.textContent = '500';
        if (plusInterval) plusInterval.textContent = '/year';
        if (yearlyNote) yearlyNote.style.display = 'flex';
        
        if (proPrice) proPrice.textContent = '4000';
        if (proInterval) proInterval.textContent = '/year';
        if (proYearlyNote) proYearlyNote.style.display = 'flex';
      } else {
        if (plusPrice) plusPrice.textContent = '50';
        if (plusInterval) plusInterval.textContent = '/month';
        if (yearlyNote) yearlyNote.style.display = 'none';
        
        if (proPrice) proPrice.textContent = '399';
        if (proInterval) proInterval.textContent = '/month';
        if (proYearlyNote) proYearlyNote.style.display = 'none';
      }
    });
  }

  // ─── Razorpay Checkout (Landing) ───
  function initRazorpayLanding() {
    const btnPlus = document.getElementById('btnLandingPlus');
    const btnPro = document.getElementById('btnLandingPro');
    if (!btnPlus || !btnPro) return;

    async function handleUpgradeClick(e, planId) {
      e.preventDefault();
      
      // Check auth First
      try {
        const authRes = await fetch('/api/auth/check');
        const authData = await authRes.json();
        
        if (!authData.authenticated) {
          window.location.href = '/signup';
          return;
        }

        // Get billing cycle
        const isYearly = document.getElementById('billingToggle').classList.contains('active');
        const billing = isYearly ? 'yearly' : 'monthly';

        // Create Order
        const orderRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, billing })
        });
        
        const orderData = await orderRes.json();
        if (orderData.error) {
          alert(orderData.error);
          return;
        }

        // Open Razorpay
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Conn',
          description: `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
          order_id: orderData.orderId,
          handler: async function (response) {
            // Verify payment
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              window.location.href = '/admin'; // Redirect to dashboard
            } else {
              alert('Payment verification failed.');
            }
          },
          theme: { color: '#a855f7' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert('Payment failed: ' + response.error.description);
        });
        rzp.open();

      } catch (err) {
        console.error('Error starting checkout:', err);
        alert('An error occurred. Please try again.');
      }
    }

    btnPlus.addEventListener('click', (e) => handleUpgradeClick(e, 'plus'));
    btnPro.addEventListener('click', (e) => handleUpgradeClick(e, 'professional'));
  }

  // ─── FAQ Accordion ───
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const btn = item.querySelector('.faq-question');
      if (!btn) return;
      btn.addEventListener('click', () => {
        // Toggle current, close others
        const isOpen = item.classList.contains('open');
        faqItems.forEach(other => other.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    });
  }

  // ─── Visual Upgrades (Cursor, Typewriter, Magnetic, Tilt) ───
  function initCustomCursor() {
    const cursor = document.getElementById('cursor-glow');
    if (!cursor) return;
    document.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
    });
    const interactables = document.querySelectorAll('a, button, .feature-card, .pricing-card, .use-case-card, .theme-preview-card');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width = '60px';
        cursor.style.height = '60px';
        cursor.style.background = 'var(--accent-light)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width = '40px';
        cursor.style.height = '40px';
        cursor.style.background = 'var(--accent)';
      });
    });
  }

  function initTypewriter() {
    const tw = document.getElementById('typewriter');
    if (!tw) return;
    const phrases = [
      "Your entire digital universe in one place.",
      "Monetize your passion effortlessly.",
      "Grow your audience exponentially.",
      "Create your digital home in seconds."
    ];
    let i = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
      const current = phrases[i % phrases.length];
      if (isDeleting) {
        tw.textContent = current.substring(0, charIndex - 1);
        charIndex--;
      } else {
        tw.textContent = current.substring(0, charIndex + 1);
        charIndex++;
      }

      let speed = isDeleting ? 30 : 70;
      if (!isDeleting && charIndex === current.length) {
        speed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        i++;
        speed = 500;
      }
      setTimeout(type, speed);
    }
    setTimeout(type, 1000);
  }

  function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-hero');
    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const mappedX = (x / (rect.width / 2)) * 12;
        const mappedY = (y / (rect.height / 2)) * 12;
        btn.style.transform = `translate(${mappedX}px, ${mappedY}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = `translate(0, 0)`;
      });
    });
  }

  function initVanillaTilt() {
    if (typeof VanillaTilt !== 'undefined') {
      VanillaTilt.init(document.querySelectorAll(".feature-card, .use-case-card, .pricing-card, .testimonial-card, .learn-card"), {
        max: 8,
        speed: 400,
        glare: true,
        "max-glare": 0.15,
        scale: 1.02
      });
    }
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initScrollReveal();
    initNavbar();
    initMegaDropdown();
    initCounters();
    initSmoothScroll();
    initContactForm();
    initAuthState();
    initBillingToggle();
    initRazorpayLanding();
    initFAQ();
    initCustomCursor();
    initTypewriter();
    initMagneticButtons();
    initVanillaTilt();
  });
})();
