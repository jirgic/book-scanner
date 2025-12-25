/**
 * Google Books API client that uses our backend cache
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Search books by query text
 */
export async function searchBooks(query, maxResults = 20) {
  try {
    const url = new URL(`${API_BASE_URL}/api/books/search`);
    url.searchParams.append('q', query);
    url.searchParams.append('maxResults', maxResults.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    return data.books || [];
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
}

/**
 * Search book by ISBN
 */
export async function searchByISBN(isbn) {
  try {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    const response = await fetch(`${API_BASE_URL}/api/books/isbn/${cleanISBN}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    return data.book || null;
  } catch (error) {
    console.error('Error searching by ISBN:', error);
    throw error;
  }
}

/**
 * Get book details by Google Books ID
 */
export async function getBookById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/books/${id}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    return data.book || null;
  } catch (error) {
    console.error('Error getting book details:', error);
    throw error;
  }
}

/**
 * Get cover image URL for a book
 */
export function getCoverImageUrl(book, size = 'medium') {
  if (!book) return null;

  // Use Google Books thumbnails
  if (book.coverImage) return book.coverImage;
  if (size === 'small' && book.smallThumbnail) return book.smallThumbnail;
  if (book.thumbnail) return book.thumbnail;

  return null;
}

/**
 * Prepare search query from OCR text
 */
export function prepareSearchQuery(text) {
  if (!text) return '';

  // Remove special characters except hyphens
  let cleaned = text.replace(/[^\w\s-]/g, ' ');

  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Take first 8 words
  const words = cleaned.split(' ').slice(0, 8);

  // Join and limit length
  const query = words.join(' ').substring(0, 100);

  return query;
}

export default {
  searchBooks,
  searchByISBN,
  getBookById,
  getCoverImageUrl,
  prepareSearchQuery
};
