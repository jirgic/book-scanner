/**
 * /api/search - Combined book search endpoint
 * Queries Google Books, Open Library, and Hardcover APIs
 */

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json';
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

  const { q, source = 'combined', limit = 20 } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing search query parameter "q"' });
  }

  try {
    let results = [];

    console.log(`Search request - query: "${q}", source: "${source}", limit: ${limit}`);

    switch (source) {
      case 'google':
        results = await searchGoogleBooks(q, limit);
        break;
      case 'openlibrary':
        results = await searchOpenLibrary(q, limit);
        break;
      case 'hardcover':
        console.log('Calling searchHardcover...');
        results = await searchHardcover(q, limit);
        console.log('searchHardcover returned:', results?.length, 'results');
        break;
      case 'combined':
      default:
        results = await searchCombined(q, limit);
        break;
    }

    // Ensure results is an array
    if (!Array.isArray(results)) {
      console.error('Results is not an array:', typeof results, results);
      results = [];
    }

    console.log(`Returning ${results.length} results for source: ${source}`);

    return res.status(200).json({
      success: true,
      query: q,
      source,
      total: results.length,
      books: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    console.error('Error stack:', error.stack);
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
 * Search Hardcover API
 */
async function searchHardcover(query, limit = 20) {
  try {
    const graphqlQuery = `
      query SearchBooks($query: String!, $perPage: Int!, $page: Int!) {
        search(
          query: $query
          query_type: "books"
          per_page: $perPage
          page: $page
        ) {
          results
        }
      }
    `;

    const requestBody = {
      query: graphqlQuery,
      variables: {
        query,
        perPage: limit,
        page: 1,
      },
    };

    console.log('Hardcover request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(HARDCOVER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Hardcover response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hardcover API error response:', errorText);
      return [];
    }

    const data = await response.json();
    console.log('Hardcover response data:', JSON.stringify(data, null, 2));

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return [];
    }

    // Check if we have search results
    if (!data.data?.search?.results) {
      console.log('No search results in response');
      return [];
    }

    // Parse the results - Hardcover returns a JSON string
    let results;
    try {
      results = typeof data.data.search.results === 'string'
        ? JSON.parse(data.data.search.results)
        : data.data.search.results;
    } catch (parseError) {
      console.error('Failed to parse Hardcover results:', parseError);
      console.error('Raw results:', data.data.search.results);
      return [];
    }

    // Ensure results is an array
    if (!Array.isArray(results)) {
      console.error('Hardcover results is not an array:', results);
      return [];
    }

    console.log(`Found ${results.length} results from Hardcover`);
    return results.map((book) => normalizeHardcoverBook(book));
  } catch (error) {
    console.error('Hardcover search error:', error);
    return [];
  }
}

/**
 * Combined search - Google Books primary, Hardcover and Open Library fallback
 */
async function searchCombined(query, limit = 20) {
  try {
    // Try all sources in parallel
    const [googleResults, hardcoverResults, openLibraryResults] = await Promise.allSettled([
      searchGoogleBooks(query, limit),
      searchHardcover(query, limit),
      searchOpenLibrary(query, limit),
    ]);

    // Collect successful results
    const results = [];

    if (googleResults.status === 'fulfilled' && googleResults.value) {
      results.push(...googleResults.value);
    }

    if (hardcoverResults.status === 'fulfilled' && hardcoverResults.value) {
      results.push(...hardcoverResults.value);
    }

    if (openLibraryResults.status === 'fulfilled' && openLibraryResults.value) {
      results.push(...openLibraryResults.value);
    }

    // Merge and deduplicate by ISBN or title+author
    const deduplicated = deduplicateResults(results);

    return deduplicated.slice(0, limit);
  } catch (error) {
    console.error('Combined search error:', error);
    // Return whatever we can get
    return [];
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
 * Normalize Hardcover response
 */
function normalizeHardcoverBook(book) {
  // Get ISBN from editions if available
  const isbn13 = book.editions?.find(e => e.isbn_13)?.isbn_13 ||
                 book.isbn_13 || null;
  const isbn10 = book.editions?.find(e => e.isbn_10)?.isbn_10 ||
                 book.isbn_10 || null;
  const isbn = isbn13 || isbn10;

  // Get authors
  const authors = book.contributions?.map(c => c.author?.name || c.author) || [];
  const author = authors[0] || 'Unknown Author';

  // Extract year from release_date
  const year = book.release_date ? parseInt(book.release_date.slice(0, 4)) : null;

  // Get cover image
  const coverUrl = book.cached_image?.url || book.image?.url || null;

  return {
    id: book.id?.toString(),
    source: 'hardcover',
    key: `/hardcover/${book.id}`,
    title: book.title || 'Unknown Title',
    subtitle: book.subtitle,
    author,
    authors,
    year,
    description: book.description,
    coverUrl,
    coverUrlLarge: coverUrl, // Hardcover provides high-quality images
    isbn,
    isbns: [isbn13, isbn10].filter(Boolean),
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

/**
 * Deduplicate results from multiple sources
 */
function deduplicateResults(books) {
  const seen = new Set();
  const results = [];

  for (const book of books) {
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
