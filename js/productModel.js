/**
 * Product — OOP model for a product entity
 * Talks to https://69c8261363393440b3177270.mockapi.io/products
 * Uses localStorage to pass selected product to detail page
 */
class Product {
  static BASE_URL       = 'https://69c8261363393440b3177270.mockapi.io/products';
  static LS_KEY         = 'selectedProduct';

  /**
   * @param {Object} data
   */
  constructor({ id = null, name = '', description = '', price = '0', category = '', image = '', createdAt = null } = {}) {
    this.id          = id;
    this.name        = name;
    this.description = description;
    this.price       = parseFloat(price) || 0;
    this.category    = category;
    this.image       = image;
    this.createdAt   = createdAt;
  }

  /**
   * Fetch all products from the API
   * @returns {Promise<Product[]>}
   */
  static async fetchAll() {
    const response = await fetch(Product.BASE_URL);
    if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);
    const data = await response.json();
    return data.map(p => new Product(p));
  }

  /**
   * Save this product to localStorage and navigate to detail page
   */
  saveToLocalStorage() {
    localStorage.setItem(Product.LS_KEY, JSON.stringify(this));
  }

  /**
   * Load a Product instance from localStorage
   * @returns {Product|null}
   */
  static loadFromLocalStorage() {
    const raw = localStorage.getItem(Product.LS_KEY);
    if (!raw) return null;
    try {
      return new Product(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  /**
   * Clear the stored product from localStorage
   */
  static clearFromLocalStorage() {
    localStorage.removeItem(Product.LS_KEY);
  }

  /**
   * Format price as USD currency string
   * @returns {string}
   */
  getFormattedPrice() {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.price);
  }

  /**
   * Format createdAt as a readable date string
   * @returns {string}
   */
  getFormattedDate() {
    if (!this.createdAt) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(this.createdAt));
  }

  /**
   * Get a fallback image if the product image fails
   * @returns {string}
   */
  getImageUrl() {
    return this.image || `https://picsum.photos/seed/${this.id}/600/400`;
  }
}
