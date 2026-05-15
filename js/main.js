/**
 * app.js — Page router & initialization
 * Detects which page is active and calls the correct init function.
 * Depends on: CookieManager, User, Product, Auth, UI
 */

// ═══════════════════════════════════════════════
// REGEX VALIDATION PATTERNS
// ═══════════════════════════════════════════════

/**
 * Name: 2–50 characters, letters & spaces only (allows accented chars)
 */
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]{2,50}$/;

/**
 * Email: standard RFC-like email pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Password: At least 8 characters, with:
 *   - at least one uppercase letter
 *   - at least one lowercase letter
 *   - at least one digit
 *   - at least one special character (!@#$%^&*…)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;

// ─────────────────────────────────────────────
// Shared: Run on every page load
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 1. Apply saved theme immediately
  UI.loadTheme();

  // 2. Attach theme toggle buttons (if any)
  UI.attachThemeToggle('.theme-toggle');

  // 3. Initialize sidebar (if present)
  UI.initSidebar();

  // 4. Route to the correct page initializer
  const page = document.body.dataset.page;
  switch (page) {
    case 'login':   initLoginPage();   break;
    case 'signup':  initSignupPage();  break;
    case 'home':    initHomePage();    break;
    case 'product': initProductPage(); break;
  }
});

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
async function initLoginPage() {
  // Redirect if already logged in
  Auth.redirectIfLoggedIn('home.html');

  const form        = document.getElementById('loginForm');
  const emailInput  = document.getElementById('loginEmail');
  const passInput   = document.getElementById('loginPassword');
  const emailErr    = document.getElementById('loginEmailError');
  const passErr     = document.getElementById('loginPassError');
  const submitBtn   = document.getElementById('loginSubmit');
  const togglePass  = document.getElementById('togglePassword');
  const signupLink  = document.getElementById('signupLink');

  // Pre-fill email if redirected from signup hint
  const params = new URLSearchParams(window.location.search);
  if (params.get('email')) emailInput.value = params.get('email');

  // Toggle password visibility
  if (togglePass) {
    togglePass.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePass.textContent = isPass ? '🙈' : '👁';
    });
  }

  // Signup link with email pre-fill
  if (signupLink) {
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const url   = email ? `signup.html?email=${encodeURIComponent(email)}` : 'signup.html';
      window.location.href = url;
    });
  }

  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors([emailErr, passErr], [emailInput, passInput]);

    const email    = emailInput.value.trim();
    const password = passInput.value;

    // ── Regex Validation ──
    if (!email) { showFieldError(emailInput, emailErr, 'Email is required.'); return; }
    if (!EMAIL_REGEX.test(email)) {
      showFieldError(emailInput, emailErr, 'Enter a valid email (e.g. user@domain.com).');
      return;
    }
    if (!password) { showFieldError(passInput, passErr, 'Password is required.'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';
    UI.showLoader();

    try {
      await Auth.login(email, password);
      UI.showToast('Welcome back! Redirecting…', 'success');
      setTimeout(() => window.location.replace('home.html'), 900);
    } catch (err) {
      if (err.code === 'USER_NOT_FOUND') {
        // Redirect to signup with email pre-filled
        UI.showToast('Account not found. Redirecting to Sign Up…', 'info');
        setTimeout(() => window.location.href = `signup.html?email=${encodeURIComponent(email)}`, 1200);
      } else if (err.code === 'WRONG_PASSWORD') {
        showFieldError(passInput, passErr, err.message);
      } else {
        UI.showToast('Network error. Please try again.', 'error');
      }
    } finally {
      UI.hideLoader();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });

  // ── Forgot Password Modal ──
  const forgotLink     = document.getElementById('forgotPasswordLink');
  const forgotModal    = document.getElementById('forgotModal');
  const forgotForm     = document.getElementById('forgotForm');
  const forgotEmail    = document.getElementById('forgotEmail');
  const forgotEmailErr = document.getElementById('forgotEmailError');
  const forgotSubmit   = document.getElementById('forgotSubmit');
  const forgotBack     = document.getElementById('forgotBackLink');

  if (forgotLink && forgotModal) {
    // Open modal
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.classList.remove('hidden');
      // Pre-fill with login email if present
      if (emailInput.value.trim()) forgotEmail.value = emailInput.value.trim();
      forgotEmail.focus();
    });

    // Close modal
    forgotBack?.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.classList.add('hidden');
    });

    // Click overlay to close
    forgotModal.addEventListener('click', (e) => {
      if (e.target === forgotModal) forgotModal.classList.add('hidden');
    });

    // Submit forgot password
    forgotForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors([forgotEmailErr], [forgotEmail]);

      const email = forgotEmail.value.trim();
      if (!email) { showFieldError(forgotEmail, forgotEmailErr, 'Email is required.'); return; }
      if (!EMAIL_REGEX.test(email)) { showFieldError(forgotEmail, forgotEmailErr, 'Enter a valid email.'); return; }

      forgotSubmit.disabled = true;
      forgotSubmit.textContent = 'Sending…';

      try {
        const user = await User.findByEmail(email);
        if (!user) {
          showFieldError(forgotEmail, forgotEmailErr, 'No account found with this email.');
        } else {
          UI.showToast(`Password reset link sent to ${email}`, 'success');
          forgotModal.classList.add('hidden');
        }
      } catch {
        UI.showToast('Network error. Please try again.', 'error');
      } finally {
        forgotSubmit.disabled = false;
        forgotSubmit.textContent = 'Send Reset Link';
      }
    });
  }
}

// ─────────────────────────────────────────────
// SIGNUP PAGE
// ─────────────────────────────────────────────
async function initSignupPage() {
  Auth.redirectIfLoggedIn('home.html');

  const form       = document.getElementById('signupForm');
  const nameInput  = document.getElementById('signupName');
  const emailInput = document.getElementById('signupEmail');
  const passInput  = document.getElementById('signupPassword');
  const confInput  = document.getElementById('signupConfirm');
  const avatarInput = document.getElementById('signupAvatar');
  const nameErr    = document.getElementById('signupNameError');
  const emailErr   = document.getElementById('signupEmailError');
  const passErr    = document.getElementById('signupPassError');
  const confErr    = document.getElementById('signupConfError');
  const submitBtn  = document.getElementById('signupSubmit');
  const togglePass1 = document.getElementById('toggleSignupPass');
  const togglePass2 = document.getElementById('toggleSignupConf');

  // Pre-fill email from query params
  const params = new URLSearchParams(window.location.search);
  if (params.get('email') && emailInput) emailInput.value = params.get('email');

  // Toggle password visibility
  [{ btn: togglePass1, inp: passInput }, { btn: togglePass2, inp: confInput }].forEach(({ btn, inp }) => {
    if (btn && inp) {
      btn.addEventListener('click', () => {
        const isPass = inp.type === 'password';
        inp.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? '🙈' : '👁';
      });
    }
  });

  // Live avatar preview
  if (avatarInput) {
    avatarInput.addEventListener('input', () => {
      const preview = document.getElementById('avatarPreview');
      if (preview) {
        preview.src = avatarInput.value || 'https://ui-avatars.com/api/?name=User&background=6D7A91&color=fff';
      }
    });
  }

  // ── Live validation feedback ──
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      const val = nameInput.value.trim();
      nameInput.classList.remove('error', 'valid');
      if (val.length >= 2 && NAME_REGEX.test(val)) nameInput.classList.add('valid');
      else if (val.length > 0) nameInput.classList.add('error');
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const val = emailInput.value.trim();
      emailInput.classList.remove('error', 'valid');
      if (EMAIL_REGEX.test(val)) emailInput.classList.add('valid');
      else if (val.length > 3) emailInput.classList.add('error');
    });
  }

  if (passInput) {
    passInput.addEventListener('input', () => {
      const val = passInput.value;
      passInput.classList.remove('error', 'valid');
      updatePasswordStrength(val);
      if (PASSWORD_REGEX.test(val)) passInput.classList.add('valid');
      else if (val.length > 0) passInput.classList.add('error');
    });
  }

  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors([nameErr, emailErr, passErr, confErr], [nameInput, emailInput, passInput, confInput]);

    const name     = nameInput.value.trim();
    const email    = emailInput.value.trim();
    const password = passInput.value;
    const confirm  = confInput.value;
    const avatar   = avatarInput?.value.trim() || '';

    // ── Regex Validation ──
    let hasError = false;

    if (!name) {
      showFieldError(nameInput, nameErr, 'Name is required.');
      hasError = true;
    } else if (!NAME_REGEX.test(name)) {
      showFieldError(nameInput, nameErr, 'Name must be 2–50 characters, letters and spaces only.');
      hasError = true;
    }

    if (!email) {
      showFieldError(emailInput, emailErr, 'Email is required.');
      hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      showFieldError(emailInput, emailErr, 'Enter a valid email (e.g. user@domain.com).');
      hasError = true;
    }

    if (!password) {
      showFieldError(passInput, passErr, 'Password is required.');
      hasError = true;
    } else if (!PASSWORD_REGEX.test(password)) {
      showFieldError(passInput, passErr, 'Min 8 chars with uppercase, lowercase, digit & special character.');
      hasError = true;
    }

    if (password !== confirm) {
      showFieldError(confInput, confErr, 'Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Creating account…';
    UI.showLoader();

    try {
      await Auth.signup({ name, email, password, avatar });
      UI.showToast('Account created! Redirecting to login…', 'success');
      setTimeout(() => window.location.replace('index.html'), 1200);
    } catch (err) {
      if (err.code === 'EMAIL_EXISTS') {
        showFieldError(emailInput, emailErr, err.message);
      } else {
        UI.showToast('Network error. Please try again.', 'error');
      }
    } finally {
      UI.hideLoader();
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}

// ─────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────
async function initHomePage() {
  Auth.requireAuth('index.html');

  const user = Auth.getCurrentUser();
  UI.renderNavUser({ name: user.name, avatar: user.avatar });

  const grid    = document.getElementById('productsGrid');
  const search  = document.getElementById('searchInput');
  const catSel  = document.getElementById('categoryFilter');
  const countEl = document.getElementById('productCount');

  if (!grid) return;

  UI.renderSkeletons(grid, 8);

  let allProducts = [];

  try {
    allProducts = await Product.fetchAll();

    // Populate category filter
    const categories = [...new Set(allProducts.map(p => p.category))].sort();
    if (catSel) {
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        catSel.appendChild(opt);
      });
    }

    renderFiltered();
  } catch (err) {
    UI.renderError(grid, 'Failed to load products. Please refresh.');
    UI.showToast('Could not load products.', 'error');
  }

  function renderFiltered() {
    const query = search?.value.toLowerCase() || '';
    const cat   = catSel?.value || '';

    const filtered = allProducts.filter(p => {
      const matchSearch = !query || p.name.toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query);
      const matchCat    = !cat || p.category === cat;
      return matchSearch && matchCat;
    });

    if (countEl) countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

    UI.renderProductCards(filtered, grid, (product) => {
      product.saveToLocalStorage();
      window.location.href = 'product.html';
    });
  }

  // Live search & filter
  let debounceTimer;
  search?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderFiltered, 250);
  });
  catSel?.addEventListener('change', renderFiltered);
}

// ─────────────────────────────────────────────
// PRODUCT DETAIL PAGE
// ─────────────────────────────────────────────
function initProductPage() {
  Auth.requireAuth('index.html');

  const user = Auth.getCurrentUser();
  UI.renderNavUser({ name: user.name, avatar: user.avatar });

  const container = document.getElementById('productDetailContainer');
  if (!container) return;

  const product = Product.loadFromLocalStorage();
  if (!product) {
    UI.renderError(container, 'No product selected. <a href="home.html">Go back to shop</a>.');
    return;
  }

  UI.renderProductDetail(product, container);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function showFieldError(input, errorEl, message) {
  if (input) { input.classList.remove('valid'); input.classList.add('error'); }
  if (errorEl) { errorEl.textContent = message; errorEl.classList.add('visible'); }
}

function clearErrors(errorEls, inputs) {
  errorEls.forEach(el => { if (el) { el.textContent = ''; el.classList.remove('visible'); } });
  inputs.forEach(inp => { if (inp) { inp.classList.remove('error'); inp.classList.remove('valid'); } });
}

/**
 * Update the password strength indicator bars
 * @param {string} password
 */
function updatePasswordStrength(password) {
  const bars = document.querySelectorAll('.strength-bar');
  if (!bars.length) return;

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) strength++;

  bars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (i < strength) {
      if (strength <= 1)      bar.classList.add('filled-weak');
      else if (strength <= 2) bar.classList.add('filled-medium');
      else                    bar.classList.add('filled-strong');
    }
  });
}
