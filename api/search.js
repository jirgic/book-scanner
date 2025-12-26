/**
 * /api/search - Combined book search endpoint
 * Queries Google Books (primary) and Open Library (fallback)
 */

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json';
const GOODREADS_API = 'https://goodreads-api-latest-updated.p.rapidapi.com';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q, source = 'combined', limit = 20 } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing search query parameter "q"' });
  }

  try {
    let results;

    switch (source) {
      case 'google':
        results = await searchGoogleBooks(q, limit);
        break;
      case 'openlibrary':
        results = await searchOpenLibrary(q, limit);
        break;
      case 'goodreads':
        results = await searchGoodreads(q, limit);
        break;
      case 'combined':
      default:
        results = await searchCombined(q, limit);
        break;
    }

    return res.status(200).json({
      success: true,
      query: q,
      source,
      total: results.length,
      books: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message,
    });
  }
}

/**
 * Search Google Books API
 */
async function searchGoogleBooks(query, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    maxResults: Math.min(limit, 40).toString(),
    printType: 'books',
  });

  const response = await fetch(`${GOOGLE_BOOKS_API}?${params}`);

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items) {
    return [];
  }

  return data.items.map((item) => normalizeGoogleBook(item));
}

/**
 * Search Open Library API
 */
async function searchOpenLibrary(query, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    fields: 'key,title,author_name,first_publish_year,cover_i,isbn,subject,ratings_average,ratings_count,edition_count,publisher,number_of_pages_median,language',
  });

  const response = await fetch(`${OPEN_LIBRARY_API}?${params}`);

  if (!response.ok) {
    throw new Error(`Open Library API error: ${response.status}`);
  }

  const data = await response.json();

  return data.docs.map((doc) => normalizeOpenLibraryBook(doc));
}

/**
 * Search Goodreads API via RapidAPI
 */
async function searchGoodreads(query, limit = 20) {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable not set. Please add it to your .env file.');
  }

  const params = new URLSearchParams({
    q: query,
    page: '1',
  });

  const response = await fetch(`${GOODREADS_API}/search?${params}`, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'goodreads-api-latest-updated.p.rapidapi.com',
    },
  });

  if (!response.ok) {
    throw new Error(`Goodreads API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.slice(0, limit).map((book) => normalizeGoodreadsBook(book));
}

/**
 * Combined search - Google Books primary, Open Library fallback
 */
async function searchCombined(query, limit = 20) {
  try {
    // Try Google Books first
    const googleResults = await searchGoogleBooks(query, limit);

    if (googleResults.length >= 5) {
      return googleResults;
    }

    // If Google has few results, also check Open Library
    const openLibraryResults = await searchOpenLibrary(query, limit);

    // Merge and deduplicate by ISBN or title+author
    const combined = mergeResults(googleResults, openLibraryResults);

    return combined.slice(0, limit);
  } catch (error) {
    // If Google fails, fall back to Open Library only
    console.error('Google Books failed, falling back to Open Library:', error);
    return searchOpenLibrary(query, limit);
  }
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
    isbn: info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier ||
          info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier,
    isbns: info.industryIdentifiers?.map((id) => id.identifier) || [],
    pageCount: info.pageCount,
    categories: info.categories || [],
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
    isbn: doc.isbn?.[0],
    isbns: doc.isbn || [],
    pageCount: doc.number_of_pages_median,
    categories: [],
    subjects: doc.subject?.slice(0, 10) || [],
    publisher: doc.publisher?.[0],
    publishers: doc.publisher || [],
    language: doc.language?.[0],
    ratingsAverage: doc.ratings_average,
    ratingsCount: doc.ratings_count,
    editionCount: doc.edition_count,
    previewLink: `https://openlibrary.org${doc.key}`,
    infoLink: `https://openlibrary.org${doc.key}`,
  };
}

/**
 * Normalize Goodreads API response
 */
function normalizeGoodreadsBook(book) {
  // Extract ISBN from ISBN array if available
  const isbn13 = book.isbn13 || book.isbn || null;
  const isbn = isbn13 || book.isbn10 || null;

  // Extract year from publication date
  let year = null;
  if (book.publication_date) {
    const yearMatch = book.publication_date.match(/\d{4}/);
    year = yearMatch ? parseInt(yearMatch[0]) : null;
  }

  return {
    id: book.id || book.goodreads_id,
    source: 'goodreads',
    key: `/goodreads/${book.id || book.goodreads_id}`,
    title: book.title || 'Unknown Title',
    subtitle: null,
    author: book.author || book.authors?.[0] || 'Unknown Author',
    authors: book.authors || (book.author ? [book.author] : []),
    year: year,
    description: book.description || null,
    coverUrl: book.image_url || book.small_image_url || null,
    coverUrlLarge: book.large_image_url || book.image_url || null,
    isbn: isbn,
    isbns: [isbn13, book.isbn10].filter(Boolean),
    pageCount: book.num_pages || null,
    categories: [],
    subjects: [],
    publisher: book.publisher || null,
    language: null,
    ratingsAverage: book.average_rating ? parseFloat(book.average_rating) : null,
    ratingsCount: book.ratings_count ? parseInt(book.ratings_count) : null,
    previewLink: book.url || `https://www.goodreads.com/book/show/${book.id || book.goodreads_id}`,
    infoLink: book.url || `https://www.goodreads.com/book/show/${book.id || book.goodreads_id}`,
  };
}

/**
 * Merge results from multiple sources, removing duplicates
 */
function mergeResults(primary, secondary) {
  const seen = new Set();
  const results = [];

  // Add primary results first
  for (const book of primary) {
    const key = getDedupeKey(book);
    if (!seen.has(key)) {
      seen.add(key);
      results.push(book);
    }
  }

  // Add secondary results that aren't duplicates
  for (const book of secondary) {
    const key = getDedupeKey(book);
    if (!seen.has(key)) {
      seen.add(key);
      results.push(book);
    }
  }

  return results;
}

/**
 * Generate a key for deduplication
 */
function getDedupeKey(book) {
  // Prefer ISBN for matching
  if (book.isbn) {
    return `isbn:${book.isbn}`;
  }
  // Fall back to normalized title + author
  const title = book.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
  const author = book.author?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
  return `title:${title}:${author}`;
}
