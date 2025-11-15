/**
 * Input/Output Sanitization
 * Prevents XSS and injection attacks
 */

import { JSDOM } from 'jsdom';
import createDOMPurify from 'isomorphic-dompurify';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

class Sanitizer {
  constructor() {
    // Configure DOMPurify
    this.config = {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
    };
  }

  /**
   * Sanitize HTML output
   */
  sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';
    return DOMPurify.sanitize(html, this.config);
  }

  /**
   * Sanitize text input
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';

    // Remove null bytes
    let sanitized = text.replace(/\0/g, '');

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized.trim();
  }

  /**
   * Detect potential prompt injection attempts
   */
  detectInjection(text) {
    if (!text) return { safe: true };

    const suspiciousPatterns = [
      /ignore\s+(previous|above|all)\s+instructions?/i,
      /forget\s+(everything|all|previous)/i,
      /you\s+are\s+now/i,
      /new\s+instructions?:/i,
      /system\s*:/i,
      /\[SYSTEM\]/i,
      /\<\|.*?\|\>/i, // Special tokens
      /\bprompt\s+injection\b/i,
      /roleplay\s+as/i,
    ];

    const matches = suspiciousPatterns.filter((pattern) => pattern.test(text));

    return {
      safe: matches.length === 0,
      detected: matches.length > 0,
      patterns: matches.length,
    };
  }
}

export default new Sanitizer();
