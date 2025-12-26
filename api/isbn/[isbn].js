/**
 * /api/isbn/[isbn] - ISBN lookup endpoint
 * Checks multiple sources for book data by ISBN
 */

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_ISBN_API = 'https://openlibrary.org/isbn';
const HARDCOVER_API_URL = 'https://api.hardcover.app/v1/graphql';

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
    const [googleResult, hardcoverResult, openLibraryResult] = await Promise.allSettled([
      lookupGoogleBooks(cleanISBN),
      lookupHardcover(cleanISBN),
      lookupOpenLibrary(cleanISBN),
    ]);

    // Prefer results in order: Google Books, Hardcover, Open Library
    let book = null;
    let source = null;

    if (googleResult.status === 'fulfilled' && googleResult.value) {
      book = googleResult.value;
      source = 'google';
    } else if (hardcoverResult.status === 'fulfilled' && hardcoverResult.value) {
      book = hardcoverResult.value;
      source = 'hardcover';
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

/**
 * Lookup book by ISBN in Hardcover
 */
async function lookupHardcover(isbn) {
  const graphqlQuery = `
    query BookByISBN($isbn: String!) {
      books(
        where: {
          _or: [
            { editions: { isbn_10: { _eq: $isbn } } }
            { editions: { isbn_13: { _eq: $isbn } } }
          ]
        }
        limit: 1
      ) {
        id
        slug
        title
        subtitle
        description
        pages
        release_date
        rating
        ratings_count
        users_read_count
        users_count
        cached_image {
          url
        }
        contributions {
          author {
            id
            name
            slug
          }
        }
        editions {
          isbn_10
          isbn_13
          publisher_name
        }
        cached_tags
      }
    }
  `;

  // Check for optional API key
  const apiKey = process.env.HARDCOVER_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(HARDCOVER_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: graphqlQuery,
      variables: {
        isbn,
      },
    }),
  });

  if (!response.ok) {
    // Return null for 401 (authentication required)
    if (response.status === 401) {
      console.log('Hardcover API requires authentication. Set HARDCOVER_API_KEY to enable.');
      return null;
    }
    throw new Error(`Hardcover API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    // Not an error, just no results
    return null;
  }

  if (!data.data.books || data.data.books.length === 0) {
    return null;
  }

  const book = data.data.books[0];

  // Get ISBN from editions if available
  const isbn13 = book.editions?.find(e => e.isbn_13)?.isbn_13 || isbn;
  const isbn10 = book.editions?.find(e => e.isbn_10)?.isbn_10;

  // Get authors
  const authors = book.contributions?.map(c => c.author?.name) || [];
  const author = authors[0] || 'Unknown Author';

  // Extract year from release_date
  const year = book.release_date ? parseInt(book.release_date.slice(0, 4)) : null;

  // Get cover image
  const coverUrl = book.cached_image?.url || null;

  return {
    id: book.id?.toString(),
    source: 'hardcover',
    key: `/hardcover/${book.id}`,
    slug: book.slug,
    title: book.title || 'Unknown Title',
    subtitle: book.subtitle,
    author,
    authors,
    year,
    description: book.description,
    coverUrl,
    coverUrlLarge: coverUrl, // Hardcover provides high-quality images
    isbn: isbn13 || isbn10 || isbn,
    pageCount: book.pages,
    categories: [],
    subjects: book.cached_tags || [],
    publisher: book.editions?.[0]?.publisher_name,
    language: null,
    ratingsAverage: book.rating,
    ratingsCount: book.ratings_count,
    previewLink: `https://hardcover.app/books/${book.slug || book.id}`,
    infoLink: `https://hardcover.app/books/${book.slug || book.id}`,
  };
}
