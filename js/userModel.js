/**
 * User — OOP model for a user entity
 * Talks to https://69c8261363393440b3177270.mockapi.io/users
 */
class User {
  static BASE_URL = 'https://69c8261363393440b3177270.mockapi.io/users';

  /**
   * @param {Object} data
   */
  constructor({ id = null, name = '', email = '', password = '', avatar = '', createdAt = null } = {}) {
    this.id        = id;
    this.name      = name;
    this.email     = email;
    this.password  = password;
    this.avatar    = avatar;
    this.createdAt = createdAt;
  }

  /**
   * Fetch all users from the API
   * @returns {Promise<User[]>}
   */
  static async fetchAll() {
    const response = await fetch(User.BASE_URL);
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
    const data = await response.json();
    return data.map(u => new User(u));
  }

  /**
   * Find a user by email
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  static async findByEmail(email) {
    const users = await User.fetchAll();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Create (POST) a new user to the API
   * @param {Object} data — { name, email, password, avatar }
   * @returns {Promise<User>}
   */
  static async create(data) {
    const response = await fetch(User.BASE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create user: ${response.status}`);
    const created = await response.json();
    return new User(created);
  }

  /**
   * Get a default avatar if none provided
   * @returns {string}
   */
  getAvatar() {
    return this.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=6D7A91&color=fff&bold=true`;
  }

  /**
   * Return display-friendly first name
   * @returns {string}
   */
  getFirstName() {
    return this.name.split(' ')[0];
  }
}
