/**
 * Auth — Authentication class
 * Depends on: User, CookieManager
 */
class Auth {
  /**
   * Attempt to log in with email and password.
   * Fetches all users, finds a match, stores session in cookies.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<User>} — resolved user on success
   * @throws {Error} — 'USER_NOT_FOUND' | 'WRONG_PASSWORD' | network error
   */
  static async login(email, password) {
    const user = await User.findByEmail(email);

    if (!user) {
      const err = new Error('No account found with this email address.');
      err.code  = 'USER_NOT_FOUND';
      throw err;
    }

    if (user.password !== password) {
      const err = new Error('Incorrect password. Please try again.');
      err.code  = 'WRONG_PASSWORD';
      throw err;
    }

    // Store session in cookies (7-day expiry)
    CookieManager.set('userId',    user.id);
    CookieManager.set('userEmail', user.email);
    CookieManager.set('userName',  user.name);
    CookieManager.set('userAvatar', user.getAvatar());

    return user;
  }

  /**
   * Register a new user and return the created user.
   * Does NOT set session cookies — user must log in after signing up.
   *
   * @param {Object} userData — { name, email, password, avatar? }
   * @returns {Promise<User>}
   * @throws {Error} — 'EMAIL_EXISTS' | network error
   */
  static async signup(userData) {
    // Check if email already exists
    const existing = await User.findByEmail(userData.email);
    if (existing) {
      const err = new Error('An account with this email already exists.');
      err.code  = 'EMAIL_EXISTS';
      throw err;
    }

    const user = await User.create(userData);
    // No cookies stored — user will be redirected to login page
    return user;
  }

  /**
   * Log out — clear all session cookies
   */
  static logout() {
    CookieManager.clearSession();
    CookieManager.delete('userAvatar');
  }

  /**
   * Check whether a user session exists (userId cookie present)
   * @returns {boolean}
   */
  static isLoggedIn() {
    return CookieManager.exists('userId');
  }

  /**
   * Retrieve current session info from cookies
   * @returns {{ id: string, email: string, name: string, avatar: string }|null}
   */
  static getCurrentUser() {
    if (!Auth.isLoggedIn()) return null;
    return {
      id:     CookieManager.get('userId'),
      email:  CookieManager.get('userEmail'),
      name:   CookieManager.get('userName'),
      avatar: CookieManager.get('userAvatar'),
    };
  }

  /**
   * Require authentication — if not logged in, redirect to login page.
   * Call this at the top of protected pages.
   * @param {string} [loginPage='index.html']
   */
  static requireAuth(loginPage = 'index.html') {
    if (!Auth.isLoggedIn()) {
      window.location.replace(loginPage);
    }
  }

  /**
   * Redirect if already logged in — call on login/signup pages.
   * @param {string} [homePage='home.html']
   */
  static redirectIfLoggedIn(homePage = 'home.html') {
    if (Auth.isLoggedIn()) {
      window.location.replace(homePage);
    }
  }
}
