/* ═══════════════════════════════════════════════════════════
   CONN — Auth Page Logic (Login / Signup)
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  function showError(msg) {
    const el = document.getElementById("authError");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("visible");
  }

  function hideError() {
    const el = document.getElementById("authError");
    if (el) el.classList.remove("visible");
  }

  // ─── Login ───
  function initLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const btn = form.querySelector(".auth-submit");

      if (!email || !password) {
        showError("Please fill in all fields.");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Signing in…";
     btn.disabled = true;
     btn.style.opacity = '0.7';
     btn.style.cursor = 'not-allowed';
          const btnContent = btn.querySelector('.btn-content');
          const btnLoader = btn.querySelector('.btn-loader');
          btnContent.style.display = 'none';
          btnLoader.style.display = 'inline';

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          showError(data.error || "Login failed.");
          btn.disabled = false;
          btn.textContent = "Sign In";
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          btnContent.style.display = 'flex';
          btnLoader.style.display = 'none';
          return;
        }

        window.location.href = "/admin";
      } catch (err) {
        showError("Network error. Please try again.");
        btn.disabled = false;
        btn.textContent = "Sign In";
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btnContent.style.display = 'flex';
        btnLoader.style.display = 'none';
      }
    });
  }

  // ─── Username Availability Check ───
  let usernameCheckTimer = null;
  let lastCheckedUsername = "";

  function initUsernameCheck() {
    const input = document.getElementById("signupUsername");
    const status = document.getElementById("usernameStatus");
    const preview = document.getElementById("usernamePreview");
    if (!input || !status) return;

    input.addEventListener("input", () => {
      const raw = input.value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/--+/g, "-");
      input.value = raw;

      // Update preview
      if (preview) {
        preview.textContent = raw || "your-username";
      }

      // Clear previous timer
      if (usernameCheckTimer) clearTimeout(usernameCheckTimer);

      if (raw.length < 3) {
        status.style.opacity = "0";
        status.textContent = "";
        return;
      }

      // Debounce the check
      usernameCheckTimer = setTimeout(async () => {
        if (raw === lastCheckedUsername) return;
        lastCheckedUsername = raw;

        try {
          const res = await fetch(
            `/api/auth/check-username/${encodeURIComponent(raw)}`,
          );
          const data = await res.json();

          if (input.value.toLowerCase() !== raw) return; // Input changed since we started

          if (data.available) {
            status.textContent = "✓";
            status.style.color = "#4ade80";
            status.style.opacity = "1";
            input.style.borderColor = "rgba(74, 222, 128, 0.5)";
          } else {
            status.textContent = "✗";
            status.style.color = "#f87171";
            status.style.opacity = "1";
            input.style.borderColor = "rgba(248, 113, 113, 0.5)";
          }
        } catch (err) {
          status.style.opacity = "0";
        }
      }, 400);
    });

    const copyBtn = document.getElementById("copyProfileBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async function () {
        const username = input.value.trim();

        if (!username) {
          copyBtn.textContent = "No username!";
          copyBtn.style.background = "#ef4444";
          setTimeout(() => {
            copyBtn.textContent = "Copy";
            copyBtn.style.background = "#a855f7";
          }, 2000);
          return;
        }

        const profileLink = `conn.com/u/${username}`;

        try {
          await navigator.clipboard.writeText(profileLink);
        } catch {
          // Fallback for older browsers
          const tmp = document.createElement("input");
          tmp.value = profileLink;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand("copy");
          document.body.removeChild(tmp);
        }

        copyBtn.textContent = "Copied ✓";
        copyBtn.style.background = "#22c55e";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
          copyBtn.style.background = "#a855f7";
        }, 2000);
      });
    }
  }

  // ─── Copy Profile Link ───
  function initCopyProfileBtn() {
    const btn = document.getElementById('copyProfileBtn');
    const preview = document.getElementById('usernamePreview');
    if (!btn || !preview) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      // Get the username from the preview
      const username = preview.textContent;
      if (!username || username === 'your-username') {
        showError('Please enter a username first.');
        return;
      }

      // Construct the profile URL using current origin
      const profileUrl = `${window.location.origin}/u/${username}`;

      try {
        // Try using the modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(profileUrl);
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = profileUrl;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        // Show "Copied!" feedback
        const originalText = btn.textContent;
        const originalBg = btn.style.background;
        btn.textContent = 'Copied!';
        btn.style.background = '#4ade80';

        // Revert after 2 seconds
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = originalBg;
        }, 2000);
      } catch (err) {
        showError('Failed to copy. Please try again.');
      }
    });
  }

  // ─── Signup ───
  function initSignup() {
    const form = document.getElementById("signupForm");
    if (!form) return;

    // Password strength validation
    const passwordInput = document.getElementById("signupPassword");
    const strengthContainer = document.getElementById("passwordStrength");
    const strengthBars = document.querySelectorAll(".strength-bar");
    const requirements = {
      length: document.getElementById("req-length"),
      uppercase: document.getElementById("req-uppercase"),
      number: document.getElementById("req-number"),
      special: document.getElementById("req-special"),
    };

    function validatePassword(password) {
      const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      };

      // Update requirement indicators
      Object.keys(checks).forEach((key) => {
        if (requirements[key]) {
          if (checks[key]) {
            requirements[key].classList.add("valid");
          } else {
            requirements[key].classList.remove("valid");
          }
        }
      });

      // Calculate strength (0-4)
      const strength = Object.values(checks).filter(Boolean).length;

      // Update strength bars
      strengthBars.forEach((bar, index) => {
        if (index < strength) {
          bar.classList.add("active");
        } else {
          bar.classList.remove("active");
        }
      });

      return checks;
    }

    if (passwordInput && strengthContainer) {
      passwordInput.addEventListener("focus", () => {
        strengthContainer.style.display = "block";
      });

      passwordInput.addEventListener("input", () => {
        validatePassword(passwordInput.value);
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError();

      const name = document.getElementById("signupName").value.trim();
      const username =
        document.getElementById("signupUsername")?.value.trim().toLowerCase() ||
        "";
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      const confirm = document.getElementById("signupConfirm").value;
      const btn = form.querySelector(".auth-submit");

      if (!name || !email || !password || !confirm) {
        showError("Please fill in all fields.");
        return;
      }

      if (username && username.length < 3) {
        showError("Username must be at least 3 characters.");
        return;
      }

      // Validate password strength
      const passwordChecks = validatePassword(password);
      if (!passwordChecks.length) {
        showError("Password must be at least 8 characters long.");
        return;
      }
      if (!passwordChecks.uppercase) {
        showError("Password must contain at least one uppercase letter.");
        return;
      }
      if (!passwordChecks.number) {
        showError("Password must contain at least one number.");
        return;
      }
      if (!passwordChecks.special) {
        showError("Password must contain at least one special character.");
        return;
      }

      if (password !== confirm) {
        showError("Passwords do not match.");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Creating account…";
      btn.style.opacity = '0.7';
      btn.style.cursor = 'not-allowed';
      const btnContent = btn.querySelector('.btn-content');
      const btnLoader = btn.querySelector('.btn-loader');

btnContent.style.display = 'none';
btnLoader.style.display = 'inline';

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, username, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          showError(data.error || "Registration failed.");
          btn.disabled = false;
          btn.textContent = "Create Account";
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          btnContent.style.display = 'flex';
          btnLoader.style.display = 'none';
          return;
        }

        window.location.href = "/admin";
      } catch (err) {
        showError("Network error. Please try again.");
        btn.disabled = false;
        btn.textContent = "Create Account";
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btnContent.style.display = 'flex';
        btnLoader.style.display = 'none';
      }
    });
  }

  // ─── Google Auth ───

  const GOOGLE_BTN_HTML = `<svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    Continue with Google`;

  function initGoogleAuth() {
    const btn = document.getElementById("googleSignInBtn");
    if (!btn) return;

    // Fetch client ID from server
    fetch("/api/auth/google-client-id")
      .then((r) => r.json())
      .then((data) => {
        if (!data.clientId) return;

        // Wait for Google SDK to load
        const waitForGoogle = setInterval(() => {
          if (
            typeof google !== "undefined" &&
            google.accounts &&
            google.accounts.oauth2
          ) {
            clearInterval(waitForGoogle);

            const tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: data.clientId,
              scope:
                "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
              callback: handleGoogleToken,
            });

            btn.disabled = false;
            btn.addEventListener("click", () => {
              tokenClient.requestAccessToken();
            });
          }
        }, 100);

        // Timeout after 10s if SDK never loads
        setTimeout(() => clearInterval(waitForGoogle), 10000);
      })
      .catch(() => {
        /* Google auth unavailable — button stays disabled */
      });
  }

  async function handleGoogleToken(response) {
    const btn = document.getElementById("googleSignInBtn");
    hideError();

    if (response.error !== undefined) {
      // User closed the popup or there was an error
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Signing in…";
    }

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: response.access_token }),
      });

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || "Google sign-in failed.");
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = GOOGLE_BTN_HTML;
        }
        return;
      }

      window.location.href = "/admin";
    } catch (err) {
      showError("Network error. Please try again.");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = GOOGLE_BTN_HTML;
      }
    }
  }

  // ─── Init ───
  document.addEventListener("DOMContentLoaded", () => {
    initLogin();
    initSignup();
    initUsernameCheck();
    initGoogleAuth();
    initCopyProfileBtn();
  });
})();
