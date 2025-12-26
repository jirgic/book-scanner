/**
 * /api/isbn/[isbn] - ISBN lookup endpoint
 * Checks multiple sources for book data by ISBN
 */

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_ISBN_API = 'https://openlibrary.org/isbn';

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

  const { isbn } = req.query;

  if (!isbn) {
    return res.status(400).json({ error: 'Missing ISBN parameter' });
  }

  // Clean ISBN (remove hyphens and spaces)
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  // Validate ISBN format
  if (!/^(\d{10}|\d{13})$/.test(cleanISBN)) {
    return res.status(400).json({ error: 'Invalid ISBN format. Must be 10 or 13 digits.' });
  }

  try {
    // Try multiple sources in parallel
    const [googleResult, openLibraryResult] = await Promise.allSettled([
      lookupGoogleBooks(cleanISBN),
      lookupOpenLibrary(cleanISBN),
    ]);

    // Prefer Google Books result, fall back to Open Library
    let book = null;
    let source = null;

    if (googleResult.status === 'fulfilled' && googleResult.value) {
      book = googleResult.value;
      source = 'google';
    } else if (openLibraryResult.status === 'fulfilled' && openLibraryResult.value) {
      book = openLibraryResult.value;
      source = 'openlibrary';
    }

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found',
        isbn: cleanISBN,
      });
    }

    return res.status(200).json({
      success: true,
      isbn: cleanISBN,
      source,
      book,
    });
  } catch (error) {
    console.error('ISBN lookup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Lookup failed',
      message: error.message,
    });
  }
}

/**
 * Lookup book by ISBN in Google Books
 */
async function lookupGoogleBooks(isbn) {
  const params = new URLSearchParams({
    q: `isbn:${isbn}`,
    maxResults: '1',
  });

  const response = await fetch(`${GOOGLE_BOOKS_API}?${params}`);

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    return null;
  }

  const item = data.items[0];
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
    isbn: isbn,
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
 * Lookup book by ISBN in Open Library
 */
async function lookupOpenLibrary(isbn) {
  const response = await fetch(`${OPEN_LIBRARY_ISBN_API}/${isbn}.json`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Open Library API error: ${response.status}`);
  }

  const data = await response.json();

  // Get cover ID from covers array
  const coverId = data.covers?.[0];

  // Get author info if available
  let authorName = 'Unknown Author';
  if (data.authors?.[0]?.key) {
    try {
      const authorResponse = await fetch(`https://openlibrary.org${data.authors[0].key}.json`);
      if (authorResponse.ok) {
        const authorData = await authorResponse.json();
        authorName = authorData.name || 'Unknown Author';
      }
    } catch (e) {
      // Ignore author fetch errors
    }
  }

  return {
    id: data.key?.replace('/books/', ''),
    source: 'openlibrary',
    key: data.key,
    title: data.title || 'Unknown Title',
    subtitle: data.subtitle,
    author: authorName,
    authors: [authorName],
    year: data.publish_date ? parseInt(data.publish_date.match(/\d{4}/)?.[0]) : null,
    description: typeof data.description === 'string' ? data.description : data.description?.value,
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
    coverUrlLarge: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
    isbn: isbn,
    pageCount: data.number_of_pages,
    categories: [],
    subjects: data.subjects?.map(s => typeof s === 'string' ? s : s.name) || [],
    publisher: data.publishers?.[0],
    language: data.languages?.[0]?.key?.replace('/languages/', ''),
    ratingsAverage: null,
    ratingsCount: null,
    previewLink: `https://openlibrary.org${data.key}`,
    infoLink: `https://openlibrary.org${data.key}`,
  };
}
