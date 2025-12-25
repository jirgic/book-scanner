import { getCachedBook, setCachedBook } from '../database.js';

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Check if cached data is still valid
 */
function isCacheValid(cachedAt) {
  return (Date.now() - cachedAt) < CACHE_TTL;
}

/**
 * Normalize Google Books API response to match app's book structure
 */
function normalizeBook(item) {
  const volumeInfo = item.volumeInfo || {};
  const imageLinks = volumeInfo.imageLinks || {};

  // Extract ISBNs
  const identifiers = volumeInfo.industryIdentifiers || [];
  const isbn13 = identifiers.find(id => id.type === 'ISBN_13')?.identifier;
  const isbn10 = identifiers.find(id => id.type === 'ISBN_10')?.identifier;
  const isbns = identifiers.map(id => id.identifier).filter(Boolean);

  return {
    id: item.id,
    title: volumeInfo.title || 'Unknown Title',
    subtitle: volumeInfo.subtitle,
    authors: volumeInfo.authors || [],
    author: volumeInfo.authors?.[0] || 'Unknown Author',
    publisher: volumeInfo.publisher,
    publishedDate: volumeInfo.publishedDate,
    year: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate.split('-')[0]) : null,
    description: volumeInfo.description,
    isbn: isbn13 || isbn10,
    isbns: isbns,
    pageCount: volumeInfo.pageCount,
    categories: volumeInfo.categories || [],
    subjects: volumeInfo.categories || [],
    language: volumeInfo.language,
    thumbnail: imageLinks.thumbnail,
    smallThumbnail: imageLinks.smallThumbnail,
    coverImage: imageLinks.large || imageLinks.medium || imageLinks.thumbnail,
    previewLink: volumeInfo.previewLink,
    infoLink: volumeInfo.infoLink,
    averageRating: volumeInfo.averageRating,
    ratingsCount: volumeInfo.ratingsCount,
    ratingsAverage: volumeInfo.averageRating,
    source: 'google-books'
  };
}

/**
 * Search books by query with cache-first approach
 */
export async function searchBooks(query, maxResults = 20) {
  const queryValue = query.toLowerCase().trim();
  const queryType = 'search';

  // Check cache first
  const cached = getCachedBook(queryType, queryValue);
  if (cached && isCacheValid(cached.cachedAt)) {
    console.log(`Cache hit for search: "${query}"`);
    return {
      ...cached.data,
      fromCache: true
    };
  }

  console.log(`Cache miss for search: "${query}" - calling Google Books API`);

  // Make API call
  try {
    const url = new URL(GOOGLE_BOOKS_API_BASE);
    url.searchParams.append('q', query);
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('printType', 'books');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const books = (data.items || []).map(normalizeBook);

    const result = {
      query: query,
      totalItems: data.totalItems || 0,
      books: books,
      fromCache: false
    };

    // Store in cache
    setCachedBook(queryType, queryValue, result);

    return result;
  } catch (error) {
    console.error('Error searching Google Books:', error);
    throw error;
  }
}

/**
 * Search book by ISBN with cache-first approach
 */
export async function searchByISBN(isbn) {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  const queryType = 'isbn';

  // Check cache first
  const cached = getCachedBook(queryType, cleanISBN);
  if (cached && isCacheValid(cached.cachedAt)) {
    console.log(`Cache hit for ISBN: ${isbn}`);
    return {
      ...cached.data,
      fromCache: true
    };
  }

  console.log(`Cache miss for ISBN: ${isbn} - calling Google Books API`);

  // Make API call
  try {
    const url = new URL(GOOGLE_BOOKS_API_BASE);
    url.searchParams.append('q', `isbn:${cleanISBN}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const result = {
      isbn: cleanISBN,
      book: data.items && data.items.length > 0 ? normalizeBook(data.items[0]) : null,
      fromCache: false
    };

    // Store in cache
    setCachedBook(queryType, cleanISBN, result);

    return result;
  } catch (error) {
    console.error('Error searching Google Books by ISBN:', error);
    throw error;
  }
}

/**
 * Get book details by Google Books ID with cache-first approach
 */
export async function getBookById(bookId) {
  const queryType = 'book-id';

  // Check cache first
  const cached = getCachedBook(queryType, bookId);
  if (cached && isCacheValid(cached.cachedAt)) {
    console.log(`Cache hit for book ID: ${bookId}`);
    return {
      ...cached.data,
      fromCache: true
    };
  }

  console.log(`Cache miss for book ID: ${bookId} - calling Google Books API`);

  // Make API call
  try {
    const url = `${GOOGLE_BOOKS_API_BASE}/${bookId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const book = normalizeBook(data);

    const result = {
      book: book,
      fromCache: false
    };

    // Store in cache
    setCachedBook(queryType, bookId, result);

    return result;
  } catch (error) {
    console.error('Error fetching book details:', error);
    throw error;
  }
}
