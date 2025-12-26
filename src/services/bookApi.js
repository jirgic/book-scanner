/**
 * Book API Service
 * Uses Vercel API routes when available, falls back to direct API calls
 */

// Determine if we're running with Vercel API or standalone
const USE_VERCEL_API = true; // Set to false for GitHub Pages without backend

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_ISBN_API = 'https://openlibrary.org/isbn';

// API base URL - empty for relative paths (Vercel), or set for different host
const API_BASE = '';

/**
 * Search for books
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<object>} Search results
 */
export async function searchBooks(query, options = {}) {
  const { source = 'combined', limit = 20 } = options;

  if (USE_VERCEL_API) {
    // Use our Vercel API
    const params = new URLSearchParams({
      q: query,
      source,
      limit: limit.toString(),
    });

    const response = await fetch(`${API_BASE}/api/search?${params}`);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      total: data.total,
      books: data.books,
      source: data.source,
    };
  } else {
    // Direct API calls (for GitHub Pages without backend)
    return searchDirectly(query, limit);
  }
}

/**
 * Direct search without backend (fallback)
 */
async function searchDirectly(query, limit = 20) {
  try {
    // Try Google Books first
    const googleResults = await searchGoogleBooks(query, limit);
    if (googleResults.length >= 5) {
      return { total: googleResults.length, books: googleResults, source: 'google' };
    }

    // Fall back to Open Library
    const olResults = await searchOpenLibrary(query, limit);
    const combined = [...googleResults, ...olResults].slice(0, limit);
    return { total: combined.length, books: combined, source: 'combined' };
  } catch (error) {
    // If Google fails, try Open Library only
    const olResults = await searchOpenLibrary(query, limit);
    return { total: olResults.length, books: olResults, source: 'openlibrary' };
  }
}

/**
 * Search Google Books directly
 */
async function searchGoogleBooks(query, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    maxResults: Math.min(limit, 40).toString(),
    printType: 'books',
  });

  const response = await fetch(`${GOOGLE_BOOKS_API}?${params}`);
  if (!response.ok) throw new Error(`Google Books error: ${response.status}`);

  const data = await response.json();
  if (!data.items) return [];

  return data.items.map(normalizeGoogleBook);
}

/**
 * Search Open Library directly
 */
async function searchOpenLibrary(query, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    fields: 'key,title,author_name,first_publish_year,cover_i,isbn,subject,ratings_average,ratings_count,edition_count,publisher,number_of_pages_median,language',
  });

  const response = await fetch(`${OPEN_LIBRARY_API}?${params}`);
  if (!response.ok) throw new Error(`Open Library error: ${response.status}`);

  const data = await response.json();
  return data.docs.map(normalizeOpenLibraryBook);
}

/**
 * Look up a book by ISBN
 */
export async function lookupISBN(isbn) {
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  if (USE_VERCEL_API) {
    const response = await fetch(`${API_BASE}/api/isbn/${cleanISBN}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`ISBN lookup failed: ${response.status}`);

    const data = await response.json();
    return data.book;
  } else {
    // Direct lookup
    try {
      const googleResult = await lookupGoogleISBN(cleanISBN);
      if (googleResult) return googleResult;
    } catch (e) {}

    try {
      const olResult = await lookupOpenLibraryISBN(cleanISBN);
      if (olResult) return olResult;
    } catch (e) {}

    return null;
  }
}

/**
 * Google Books ISBN lookup
 */
async function lookupGoogleISBN(isbn) {
  const params = new URLSearchParams({ q: `isbn:${isbn}`, maxResults: '1' });
  const response = await fetch(`${GOOGLE_BOOKS_API}?${params}`);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data.items?.length) return null;

  return normalizeGoogleBook(data.items[0]);
}

/**
 * Open Library ISBN lookup
 */
async function lookupOpenLibraryISBN(isbn) {
  const response = await fetch(`${OPEN_LIBRARY_ISBN_API}/${isbn}.json`);
  if (!response.ok) return null;

  const data = await response.json();
  const coverId = data.covers?.[0];

  return {
    id: data.key?.replace('/books/', ''),
    source: 'openlibrary',
    key: data.key,
    title: data.title || 'Unknown Title',
    author: 'Unknown Author',
    authors: [],
    year: data.publish_date ? parseInt(data.publish_date.match(/\d{4}/)?.[0]) : null,
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
    coverUrlLarge: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
    isbn,
    pageCount: data.number_of_pages,
    subjects: data.subjects || [],
    publisher: data.publishers?.[0],
  };
}

/**
 * Normalize Google Books response
 */
function normalizeGoogleBook(item) {
  const info = item.volumeInfo || {};
  const imageLinks = info.imageLinks || {};

  return {
    id: item.id,
    source: 'google',
    key: `/google/${item.id}`,
    title: info.title || 'Unknown Title',
    subtitle: info.subtitle,
    author: info.authors?.[0] || 'Unknown Author',
    authors: info.authors || [],
    year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) : null,
    description: info.description,
    coverUrl: imageLinks.thumbnail?.replace('http:', 'https:') || null,
    coverUrlLarge: imageLinks.large?.replace('http:', 'https:') ||
                   imageLinks.medium?.replace('http:', 'https:') ||
                   imageLinks.thumbnail?.replace('http:', 'https:')?.replace('zoom=1', 'zoom=2') || null,
    coverId: null,
    isbn: info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier ||
          info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier,
    pageCount: info.pageCount,
    subjects: info.categories || [],
    publisher: info.publisher,
    language: info.language,
    ratingsAverage: info.averageRating,
    ratingsCount: info.ratingsCount,
    previewLink: info.previewLink,
    infoLink: info.infoLink,
  };
}

/**
 * Normalize Open Library response
 */
function normalizeOpenLibraryBook(doc) {
  return {
    id: doc.key?.replace('/works/', ''),
    source: 'openlibrary',
    key: doc.key,
    title: doc.title || 'Unknown Title',
    subtitle: null,
    author: doc.author_name?.[0] || 'Unknown Author',
    authors: doc.author_name || [],
    year: doc.first_publish_year,
    description: null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    coverUrlLarge: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
    coverId: doc.cover_i,
    isbn: doc.isbn?.[0],
    pageCount: doc.number_of_pages_median,
    subjects: doc.subject?.slice(0, 10) || [],
    publisher: doc.publisher?.[0],
    language: doc.language?.[0],
    ratingsAverage: doc.ratings_average,
    ratingsCount: doc.ratings_count,
    editionCount: doc.edition_count,
    previewLink: `https://openlibrary.org${doc.key}`,
    infoLink: `https://openlibrary.org${doc.key}`,
  };
}

/**
 * Get cover URL from book object
 */
export function getCoverUrl(book, size = 'medium') {
  if (!book) return null;

  if (size === 'large' && book.coverUrlLarge) return book.coverUrlLarge;
  if (book.coverUrl) return book.coverUrl;
  if (book.coverId) {
    const sizeMap = { small: 'S', medium: 'M', large: 'L' };
    return `https://covers.openlibrary.org/b/id/${book.coverId}-${sizeMap[size] || 'M'}.jpg`;
  }

  return null;
}

/**
 * Prepare OCR text for search
 */
export function prepareSearchQuery(text) {
  if (!text) return '';

  return text
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 8)
    .join(' ')
    .slice(0, 100);
}

/**
 * Extract ISBN from text
 */
export function extractISBN(text) {
  if (!text) return null;

  const cleaned = text.replace(/[^\dXx-]/g, '');
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
