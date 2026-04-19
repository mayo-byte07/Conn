/* ═══════════════════════════════════════════════════════════
   CONN — Auth Page Logic (Login / Signup)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function showError(msg) {
    const el = document.getElementById('authError');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
  }

  function hideError() {
    const el = document.getElementById('authError');
    if (el) el.classList.remove('visible');
  }

  // ─── Login ───
  function initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const btn = form.querySelector('.auth-submit');

      if (!email || !password) {
        showError('Please fill in all fields.');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Signing in…';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
          showError(data.error || 'Login failed.');
          btn.disabled = false;
          btn.textContent = 'Sign In';
          return;
        }

        window.location.href = '/admin';
      } catch (err) {
        showError('Network error. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  // ─── Username Availability Check ───
  let usernameCheckTimer = null;
  let lastCheckedUsername = '';

  function initUsernameCheck() {
    const input = document.getElementById('signupUsername');
    const status = document.getElementById('usernameStatus');
    const preview = document.getElementById('usernamePreview');
    if (!input || !status) return;

    input.addEventListener('input', () => {
      const raw = input.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
      input.value = raw;

      // Update preview
      if (preview) {
        preview.textContent = raw || 'your-username';
      }

      // Clear previous timer
      if (usernameCheckTimer) clearTimeout(usernameCheckTimer);

      if (raw.length < 3) {
        status.style.opacity = '0';
        status.textContent = '';
        return;
      }

      // Debounce the check
      usernameCheckTimer = setTimeout(async () => {
        if (raw === lastCheckedUsername) return;
        lastCheckedUsername = raw;

        try {
          const res = await fetch(`/api/auth/check-username/${encodeURIComponent(raw)}`);
          const data = await res.json();

          if (input.value.toLowerCase() !== raw) return; // Input changed since we started

          if (data.available) {
            status.textContent = '✓';
            status.style.color = '#4ade80';
            status.style.opacity = '1';
            input.style.borderColor = 'rgba(74, 222, 128, 0.5)';
          } else {
            status.textContent = '✗';
            status.style.color = '#f87171';
            status.style.opacity = '1';
            input.style.borderColor = 'rgba(248, 113, 113, 0.5)';
          }
        } catch (err) {
          status.style.opacity = '0';
        }
      }, 400);
    });
  }

  // ─── Signup ───
  function initSignup() {
    const form = document.getElementById('signupForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const name = document.getElementById('signupName').value.trim();
      const username = document.getElementById('signupUsername')?.value.trim().toLowerCase() || '';
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirm = document.getElementById('signupConfirm').value;
      const btn = form.querySelector('.auth-submit');

      if (!name || !email || !password || !confirm) {
        showError('Please fill in all fields.');
        return;
      }

      if (username && username.length < 3) {
        showError('Username must be at least 3 characters.');
        return;
      }

      if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
      }

      if (password !== confirm) {
        showError('Passwords do not match.');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Creating account…';

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, username, email, password })
        });

        const data = await res.json();
        if (!res.ok) {
          showError(data.error || 'Registration failed.');
          btn.disabled = false;
          btn.textContent = 'Create Account';
          return;
        }

        window.location.href = '/admin';
      } catch (err) {
        showError('Network error. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initSignup();
    initUsernameCheck();
  });
})();
