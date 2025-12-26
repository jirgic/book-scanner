/**
 * API Client Service
 * Connects to our Vercel serverless functions
 */

// Use relative URL in production, full URL in development
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:3000/api' 
  : '/api';

/**
 * Search for books
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<object>} Search results
 */
export async function searchBooks(query, options = {}) {
  const { source = 'combined', limit = 20 } = options;

  const params = new URLSearchParams({
    q: query,
    source,
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE}/search?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Search failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Search failed');
  }

  return {
    total: data.total,
    books: data.books,
    source: data.source,
  };
}

/**
 * Look up a book by ISBN
 * @param {string} isbn - ISBN-10 or ISBN-13
 * @returns {Promise<object>} Book data
 */
export async function lookupISBN(isbn) {
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  const response = await fetch(`${API_BASE}/isbn/${cleanISBN}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `ISBN lookup failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'ISBN lookup failed');
  }

  return data.book;
}

/**
 * Get cover URL (works for both Google and Open Library sources)
 * @param {object} book - Book object
 * @param {string} size - 'small' | 'medium' | 'large'
 * @returns {string|null} Cover URL
 */
export function getCoverUrl(book, size = 'medium') {
  if (!book) return null;

  // If book has direct cover URLs (from our API)
  if (size === 'large' && book.coverUrlLarge) {
    return book.coverUrlLarge;
  }
  if (book.coverUrl) {
    return book.coverUrl;
  }

  // Fallback for Open Library cover ID
  if (book.coverId) {
    const sizeMap = { small: 'S', medium: 'M', large: 'L' };
    return `https://covers.openlibrary.org/b/id/${book.coverId}-${sizeMap[size] || 'M'}.jpg`;
  }

  return null;
}

/**
 * Prepare OCR text for search
 * @param {string} text - Raw OCR text
 * @returns {string} Cleaned search query
 */
export function prepareSearchQuery(text) {
  if (!text) return '';

  return text
    // Remove special characters except basic punctuation
    .replace(/[^\w\s'-]/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    // Trim
    .trim()
    // Take first ~50 characters or first 8 words
    .split(' ')
    .slice(0, 8)
    .join(' ')
    .slice(0, 100);
}

/**
 * Check if a string looks like an ISBN
 * @param {string} text - Text to check
 * @returns {string|null} Extracted ISBN or null
 */
export function extractISBN(text) {
  if (!text) return null;

  // Remove common OCR artifacts
  const cleaned = text.replace(/[^\dXx-]/g, '');

  // Try to match ISBN-13 or ISBN-10
  const isbn13Match = cleaned.match(/\d{13}/);
  if (isbn13Match) return isbn13Match[0];

  const isbn10Match = cleaned.match(/\d{9}[\dXx]/);
  if (isbn10Match) return isbn10Match[0];

  return null;
}

export default {
  searchBooks,
  lookupISBN,
  getCoverUrl,
  prepareSearchQuery,
  extractISBN,
};
