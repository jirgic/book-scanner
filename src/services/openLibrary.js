/**
 * Open Library API Service
 * https://openlibrary.org/developers/api
 */

const BASE_URL = 'https://openlibrary.org';
const COVERS_URL = 'https://covers.openlibrary.org';

/**
 * Search for books by query
 * @param {string} query - Search query (title, author, ISBN, etc.)
 * @param {object} options - Search options
 * @returns {Promise<object>} Search results
 */
export async function searchBooks(query, options = {}) {
  const {
    limit = 20,
    offset = 0,
    fields = 'key,title,author_name,first_publish_year,cover_i,isbn,subject,ratings_average,ratings_count,edition_count,publisher,number_of_pages_median,language',
  } = options;

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    offset: offset.toString(),
    fields,
  });

  const response = await fetch(`${BASE_URL}/search.json?${params}`);

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    total: data.numFound,
    offset: data.start,
    books: data.docs.map(normalizeBook),
  };
}

/**
 * Search books by ISBN
 * @param {string} isbn - ISBN-10 or ISBN-13
 * @returns {Promise<object>} Book data
 */
export async function searchByISBN(isbn) {
  // Clean ISBN (remove hyphens and spaces)
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  const response = await fetch(`${BASE_URL}/isbn/${cleanISBN}.json`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`ISBN lookup failed: ${response.status}`);
  }

  const data = await response.json();
  return normalizeBookDetail(data);
}

/**
 * Get book details by Open Library key
 * @param {string} key - Open Library work key (e.g., '/works/OL45883W')
 * @returns {Promise<object>} Book details
 */
export async function getBookDetails(key) {
  const response = await fetch(`${BASE_URL}${key}.json`);

  if (!response.ok) {
    throw new Error(`Failed to get book details: ${response.status}`);
  }

  const data = await response.json();
  return normalizeBookDetail(data);
}

/**
 * Get book ratings
 * @param {string} key - Open Library work key
 * @returns {Promise<object>} Ratings data
 */
export async function getBookRatings(key) {
  const workId = key.replace('/works/', '');
  const response = await fetch(`${BASE_URL}/works/${workId}/ratings.json`);

  if (!response.ok) {
    return { average: null, count: 0 };
  }

  const data = await response.json();
  return {
    average: data.summary?.average || null,
    count: data.summary?.count || 0,
  };
}

/**
 * Get author details
 * @param {string} key - Author key (e.g., '/authors/OL34184A')
 * @returns {Promise<object>} Author details
 */
export async function getAuthorDetails(key) {
  const response = await fetch(`${BASE_URL}${key}.json`);

  if (!response.ok) {
    throw new Error(`Failed to get author: ${response.status}`);
  }

  return response.json();
}

/**
 * Get cover image URL
 * @param {string|number} coverId - Cover ID
 * @param {string} size - Size: 'S' (small), 'M' (medium), 'L' (large)
 * @returns {string} Cover image URL
 */
export function getCoverUrl(coverId, size = 'M') {
  if (!coverId) return null;
  return `${COVERS_URL}/b/id/${coverId}-${size}.jpg`;
}

/**
 * Get cover by ISBN
 * @param {string} isbn - ISBN
 * @param {string} size - Size: 'S', 'M', 'L'
 * @returns {string} Cover URL
 */
export function getCoverByISBN(isbn, size = 'M') {
  if (!isbn) return null;
  return `${COVERS_URL}/b/isbn/${isbn}-${size}.jpg`;
}

/**
 * Get author photo URL
 * @param {string} authorKey - Author key (e.g., 'OL34184A')
 * @param {string} size - Size: 'S', 'M', 'L'
 * @returns {string} Author photo URL
 */
export function getAuthorPhotoUrl(authorKey, size = 'M') {
  if (!authorKey) return null;
  const id = authorKey.replace('/authors/', '');
  return `${COVERS_URL}/a/olid/${id}-${size}.jpg`;
}

/**
 * Normalize book data from search results
 */
function normalizeBook(doc) {
  return {
    key: doc.key,
    title: doc.title || 'Unknown Title',
    author: doc.author_name?.[0] || 'Unknown Author',
    authors: doc.author_name || [],
    year: doc.first_publish_year,
    coverId: doc.cover_i,
    isbn: doc.isbn?.[0],
    isbns: doc.isbn || [],
    subjects: doc.subject?.slice(0, 10) || [],
    ratingsAverage: doc.ratings_average,
    ratingsCount: doc.ratings_count,
    editionCount: doc.edition_count,
    publisher: doc.publisher?.[0],
    publishers: doc.publisher || [],
    pageCount: doc.number_of_pages_median,
    language: doc.language?.[0],
    languages: doc.language || [],
  };
}

/**
 * Normalize detailed book data
 */
function normalizeBookDetail(data) {
  return {
    key: data.key,
    title: data.title || 'Unknown Title',
    subtitle: data.subtitle,
    description: typeof data.description === 'string' 
      ? data.description 
      : data.description?.value,
    subjects: data.subjects || [],
    subjectPlaces: data.subject_places || [],
    subjectTimes: data.subject_times || [],
    covers: data.covers || [],
    firstPublishDate: data.first_publish_date,
    created: data.created?.value,
    lastModified: data.last_modified?.value,
  };
}

/**
 * Clean and prepare OCR text for search
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

export default {
  searchBooks,
  searchByISBN,
  getBookDetails,
  getBookRatings,
  getAuthorDetails,
  getCoverUrl,
  getCoverByISBN,
  getAuthorPhotoUrl,
  prepareSearchQuery,
};
