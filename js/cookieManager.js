/**
 * CookieManager — static utility class for cookie CRUD
 *
 * Uses document.cookie when running on a real server (http/https).
 * Falls back to localStorage when running via file:// protocol,
 * since browsers block cookies for local files.
 */
class CookieManager {
  /** Prefix used for localStorage fallback keys */
  static #LS_PREFIX = '__cookie__';

  /**
   * Returns true if we can use real cookies (running on http/https)
   * @returns {boolean}
   */
  static #canUseCookies() {
    return window.location.protocol.startsWith('http');
  }

  /**
   * Set a cookie (or localStorage entry when on file://)
   * @param {string} name
   * @param {string} value
   * @param {number} days  — expiry in days (default 7)
   */
  static set(name, value, days = 7) {
    if (CookieManager.#canUseCookies()) {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    } else {
      // fallback: store in localStorage with expiry metadata
      const payload = {
        value,
        expires: Date.now() + days * 864e5,
      };
      localStorage.setItem(CookieManager.#LS_PREFIX + name, JSON.stringify(payload));
    }
  }

  /**
   * Get a cookie value by name
   * @param {string} name
   * @returns {string|null}
   */
  static get(name) {
    if (CookieManager.#canUseCookies()) {
      const key   = encodeURIComponent(name);
      const match = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${key}=`));
      return match ? decodeURIComponent(match.split('=')[1]) : null;
    } else {
      // fallback: read from localStorage
      const raw = localStorage.getItem(CookieManager.#LS_PREFIX + name);
      if (!raw) return null;
      try {
        const payload = JSON.parse(raw);
        if (payload.expires && Date.now() > payload.expires) {
          localStorage.removeItem(CookieManager.#LS_PREFIX + name);
          return null;
        }
        return payload.value;
      } catch {
        return null;
      }
    }
  }

  /**
   * Delete a cookie by name
   * @param {string} name
   */
  static delete(name) {
    if (CookieManager.#canUseCookies()) {
      document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } else {
      localStorage.removeItem(CookieManager.#LS_PREFIX + name);
    }
  }

  /**
   * Check if a cookie (or its localStorage equivalent) exists
   * @param {string} name
   * @returns {boolean}
   */
  static exists(name) {
    return CookieManager.get(name) !== null;
  }

  /**
   * Clear all app-related session cookies / localStorage entries
   */
  static clearSession() {
    ['userId', 'userEmail', 'userName', 'userAvatar'].forEach(k => CookieManager.delete(k));
  }
}
