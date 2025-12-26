/**
 * Hardcover API Service
 * https://docs.hardcover.app/api/getting-started/
 *
 * Note: Requires API token from Hardcover account settings
 * Set VITE_HARDCOVER_API_KEY in .env for client-side usage
 */

const HARDCOVER_API_URL = 'https://api.hardcover.app/v1/graphql';

/**
 * Make a GraphQL request to Hardcover API
 * @param {string} query - GraphQL query
 * @param {object} variables - Query variables
 * @param {string} apiKey - Optional API key (for authenticated requests)
 * @returns {Promise<object>} API response
 */
async function graphqlRequest(query, variables = {}, apiKey = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add authorization if API key is provided
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(HARDCOVER_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Hardcover API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL error: ${data.errors[0].message}`);
  }

  return data.data;
}

/**
 * Search for books
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<object>} Search results
 */
export async function searchBooks(query, options = {}) {
  const {
    limit = 20,
    page = 1,
    apiKey = null,
  } = options;

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

  const variables = {
    query,
    perPage: limit,
    page,
  };

  try {
    const data = await graphqlRequest(graphqlQuery, variables, apiKey);

    // Check if we have search results
    if (!data?.search?.results) {
      return {
        total: 0,
        page,
        books: [],
      };
    }

    // Parse the results - Hardcover returns a Typesense search response
    let results;
    try {
      const searchResults = typeof data.search.results === 'string'
        ? JSON.parse(data.search.results)
        : data.search.results;

      // Hardcover uses Typesense, results are in hits[].document
      if (searchResults.hits && Array.isArray(searchResults.hits)) {
        results = searchResults.hits.map(hit => hit.document);
      } else if (Array.isArray(searchResults)) {
        // Fallback: if it's already an array of books
        results = searchResults;
      } else {
        console.error('Unexpected Hardcover results structure:', searchResults);
        return {
          total: 0,
          page,
          books: [],
        };
      }
    } catch (parseError) {
      console.error('Failed to parse Hardcover results:', parseError);
      return {
        total: 0,
        page,
        books: [],
      };
    }

    // Ensure results is an array
    if (!Array.isArray(results)) {
      console.error('Hardcover results is not an array:', results);
      return {
        total: 0,
        page,
        books: [],
      };
    }

    return {
      total: results.length,
      page,
      books: results.map(normalizeBook),
    };
  } catch (error) {
    console.error('Hardcover search error:', error);
    throw error;
  }
}

/**
 * Search books by ISBN
 * @param {string} isbn - ISBN-10 or ISBN-13
 * @param {string} apiKey - Optional API key
 * @returns {Promise<object|null>} Book data or null if not found
 */
export async function searchByISBN(isbn, apiKey = null) {
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  const graphqlQuery = `
    query BookByISBN($isbn: String!) {
      books(
        where: { isbn: { _eq: $isbn } }
        limit: 1
      ) {
        id
        slug
        title
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
        }
      }
    }
  `;

  const variables = {
    isbn: cleanISBN,
  };

  try {
    const data = await graphqlRequest(graphqlQuery, variables, apiKey);

    if (!data.books || data.books.length === 0) {
      return null;
    }

    return normalizeBook(data.books[0]);
  } catch (error) {
    console.error('Hardcover ISBN lookup error:', error);
    return null;
  }
}

/**
 * Get detailed book information by ID
 * @param {string} bookId - Hardcover book ID
 * @param {string} apiKey - Optional API key
 * @returns {Promise<object>} Book details
 */
export async function getBookDetails(bookId, apiKey = null) {
  const graphqlQuery = `
    query BookDetails($id: Int!) {
      books(where: { id: { _eq: $id } }, limit: 1) {
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
            bio
          }
        }
        editions {
          id
          isbn_10
          isbn_13
          title
          publisher_name
          pages
          release_date
        }
        series_books {
          position
          series {
            id
            name
          }
        }
        cached_tags
      }
    }
  `;

  const variables = {
    id: parseInt(bookId),
  };

  const data = await graphqlRequest(graphqlQuery, variables, apiKey);

  if (!data.books || data.books.length === 0) {
    throw new Error('Book not found');
  }

  return normalizeBook(data.books[0]);
}

/**
 * Normalize Hardcover book data to common format
 */
function normalizeBook(book) {
  // Get ISBN from editions if available
  const isbn13 = book.editions?.find(e => e.isbn_13)?.isbn_13 ||
                 book.isbn_13 || null;
  const isbn10 = book.editions?.find(e => e.isbn_10)?.isbn_10 ||
                 book.isbn_10 || null;
  const isbn = isbn13 || isbn10;

  // Get authors
  const authors = book.contributions?.map(c => c.author.name) || [];
  const author = authors[0] || 'Unknown Author';

  // Extract year from release_date
  const year = book.release_date ? parseInt(book.release_date.slice(0, 4)) : null;

  // Get cover image
  const coverUrl = book.cached_image?.url || book.image?.url || null;

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
    isbn,
    isbn10,
    isbn13,
    pageCount: book.pages,
    subjects: book.cached_tags || [],
    publisher: book.editions?.[0]?.publisher_name,
    language: null, // Not provided in basic search
    ratingsAverage: book.rating,
    ratingsCount: book.ratings_count,
    usersReadCount: book.users_read_count,
    usersCount: book.users_count,
    previewLink: `https://hardcover.app/books/${book.slug || book.id}`,
    infoLink: `https://hardcover.app/books/${book.slug || book.id}`,
    series: book.series_books?.map(sb => ({
      name: sb.series.name,
      position: sb.position,
    })),
  };
}

/**
 * Prepare search query from OCR text
 * @param {string} text - Raw OCR text
 * @returns {string} Cleaned search query
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

export default {
  searchBooks,
  searchByISBN,
  getBookDetails,
  prepareSearchQuery,
};
