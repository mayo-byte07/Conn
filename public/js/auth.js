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

  // ─── Signup ───
  function initSignup() {
    const form = document.getElementById('signupForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirm = document.getElementById('signupConfirm').value;
      const btn = form.querySelector('.auth-submit');

      if (!name || !email || !password || !confirm) {
        showError('Please fill in all fields.');
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
          body: JSON.stringify({ name, email, password })
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
  });
})();
