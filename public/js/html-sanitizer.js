/**
 * HTML Sanitization Utility
 * Provides safe methods for rendering dynamic HTML content
 */

const HtmlSanitizer = {
  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {
      text = String(text || '');
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Safely set text content using textContent instead of innerHTML
   * @param {HTMLElement} element - Target element
   * @param {string} text - Text to set
   */
  setText(element, text) {
    if (element) {
      element.textContent = text;
    }
  },

  /**
   * Safely set HTML with escaped content
   * Only use this when you have control over the template structure
   * @param {HTMLElement} element - Target element
   * @param {string} html - HTML to set (should be pre-escaped for user data)
   */
  setHtml(element, html) {
    if (element) {
      element.innerHTML = html;
    }
  },

  /**
   * Create element safely with attributes
   * @param {string} tag - Element tag
   * @param {Object} attrs - Attributes object
   * @param {string} content - Text content (safe from XSS)
   * @returns {HTMLElement}
   */
  createElement(tag, attrs = {}, content = '') {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') {
        el.className = value;
      } else if (key.startsWith('data-')) {
        el.dataset[key.slice(5)] = value;
      } else {
        el.setAttribute(key, value);
      }
    });
    if (content) {
      el.textContent = content;
    }
    return el;
  },

  /**
   * Validate HTML attribute value (prevent attribute injection)
   * @param {string} value - Value to validate
   * @returns {boolean}
   */
  isValidAttributeValue(value) {
    // Check for quotes, angle brackets, and other suspicious chars
    return !/<|>|"|'|`|javascript:/i.test(String(value || ''));
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HtmlSanitizer;
}
