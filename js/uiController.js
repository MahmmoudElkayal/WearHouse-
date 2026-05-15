/**
 * UI — DOM rendering and theme management
 * Handles all visual output: cards, detail view, toasts, loader, theme, sidebar
 */
class UI {
  static THEME_KEY = 'wearhouse-theme';

  // ── Loader ──────────────────────────────────────────────
  static showLoader() {
    if (document.getElementById('loaderOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id        = 'loaderOverlay';
    overlay.className = 'loader-overlay';
    overlay.innerHTML = '<div class="loader"></div>';
    document.body.appendChild(overlay);
  }

  static hideLoader() {
    const overlay = document.getElementById('loaderOverlay');
    if (overlay) overlay.remove();
  }

  // ── Toast ────────────────────────────────────────────────
  /**
   * Show a toast notification
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   * @param {number} duration — ms
   */
  static showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id        = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }

  // ── Theme ────────────────────────────────────────────────
  /**
   * Apply a theme ('light' | 'dark') and persist it
   * @param {'light'|'dark'} theme
   */
  static setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(UI.THEME_KEY, theme);

    // Update toggle button emoji across all pages
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });

    // Sync sidebar theme switch checkbox
    const sidebarCheck = document.getElementById('sidebarThemeCheck');
    if (sidebarCheck) sidebarCheck.checked = (theme === 'dark');
  }

  /** Toggle between light and dark */
  static toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    UI.setTheme(current === 'dark' ? 'light' : 'dark');
  }

  /** Load and apply the saved theme (called on page load) */
  static loadTheme() {
    const saved = localStorage.getItem(UI.THEME_KEY) || 'light';
    UI.setTheme(saved);
  }

  /** Attach a theme toggle button by selector */
  static attachThemeToggle(selector = '.theme-toggle') {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('click', () => UI.toggleTheme());
    });
  }

  // ── Sidebar ──────────────────────────────────────────────
  /**
   * Initialize sidebar open/close/overlay and theme switch.
   * Call once on page load for pages that have a sidebar.
   */
  static initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const openBtn = document.getElementById('sidebarOpen');
    const closeBtn = document.getElementById('sidebarClose');
    const themeCheck = document.getElementById('sidebarThemeCheck');

    if (!sidebar) return;

    const open = () => {
      sidebar.classList.add('active');
      overlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      sidebar.classList.remove('active');
      overlay?.classList.remove('active');
      document.body.style.overflow = '';
    };

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);

    // ESC key to close sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('active')) close();
    });

    // Sidebar theme switch
    if (themeCheck) {
      themeCheck.addEventListener('change', () => {
        UI.setTheme(themeCheck.checked ? 'dark' : 'light');
      });
    }

    // Sidebar logout
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', () => {
      Auth.logout();
      window.location.replace('index.html');
    });
  }

  // ── Navbar ───────────────────────────────────────────────
  /**
   * Populate the navbar user info section
   * @param {{ name: string, avatar: string }} user
   */
  static renderNavUser(user) {
    const nameEl   = document.getElementById('navUserName');
    const avatarEl = document.getElementById('navUserAvatar');
    if (nameEl)   nameEl.textContent = user.name.split(' ')[0];
    if (avatarEl) { avatarEl.src = user.avatar; avatarEl.alt = user.name; }
  }

  // ── Product Cards ────────────────────────────────────────
  /**
   * Render skeleton loading cards
   * @param {HTMLElement} container
   * @param {number} count
   */
  static renderSkeletons(container, count = 8) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text-sm"></div>
          <div class="skeleton skeleton-price"></div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render a grid of product cards
   * @param {Product[]} products
   * @param {HTMLElement} container
   * @param {Function} onViewClick — called with (product)
   */
  static renderProductCards(products, container, onViewClick) {
    if (!products.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>`;
      return;
    }

    container.innerHTML = products.map(p => `
      <article class="product-card" data-id="${p.id}" tabindex="0" role="button" aria-label="View ${p.name}">
        <div class="card-img-wrapper">
          <img src="${p.getImageUrl()}" alt="${p.name}" loading="lazy"
               onerror="this.src='https://picsum.photos/seed/${p.id}/600/400'">
          <span class="card-category-badge">${p.category}</span>
          <button class="card-view-btn" data-id="${p.id}" title="View details" aria-label="View ${p.name} details">
            👁
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title">${p.name}</h3>
          <p class="card-desc">${p.description}</p>
          <div class="card-footer-row">
            <span class="card-price">${p.getFormattedPrice()}</span>
            <span class="card-view-link">Details →</span>
          </div>
        </div>
      </article>
    `).join('');

    // Attach click events to view buttons and cards
    container.querySelectorAll('.card-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const product = products.find(p => p.id === id);
        if (product) onViewClick(product);
      });
    });

    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-view-btn')) return;
        const id = card.dataset.id;
        const product = products.find(p => p.id === id);
        if (product) onViewClick(product);
      });
    });

    // Keyboard support
    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.querySelector('.card-view-btn')?.click();
        }
      });
    });
  }

  // ── Product Detail ───────────────────────────────────────
  /**
   * Render product detail view
   * @param {Product} product
   * @param {HTMLElement} container
   */
  static renderProductDetail(product, container) {
    container.innerHTML = `
      <a href="home.html" class="product-detail-back" id="backBtn">← Back to Products</a>
      <div class="product-detail-grid">
        <div class="product-detail-img-wrapper">
          <img src="${product.getImageUrl()}" alt="${product.name}"
               onerror="this.src='https://picsum.photos/seed/${product.id}/600/400'">
        </div>
        <div class="product-detail-info">
          <span class="product-detail-badge">${product.category}</span>
          <h1 class="product-detail-name">${product.name}</h1>
          <p class="product-detail-desc">${product.description}</p>
          <p class="product-detail-price">${product.getFormattedPrice()}</p>
          <div class="product-detail-meta">
            <div class="detail-meta-row">
              <span class="detail-meta-label">Product ID</span>
              <span class="detail-meta-value">#${product.id}</span>
            </div>
            <div class="detail-meta-row">
              <span class="detail-meta-label">Category</span>
              <span class="detail-meta-value">${product.category}</span>
            </div>
            <div class="detail-meta-row">
              <span class="detail-meta-label">Added on</span>
              <span class="detail-meta-value">${product.getFormattedDate()}</span>
            </div>
          </div>
          <button class="btn btn-primary" onclick="window.location.href='home.html'" id="backToShopBtn">
            ← Back to Shop
          </button>
        </div>
      </div>
    `;
  }

  /** Show an error message inside a container */
  static renderError(container, message = 'Something went wrong.') {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Oops!</h3>
        <p>${message}</p>
      </div>`;
  }
}
