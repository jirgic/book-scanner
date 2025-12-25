# Book Scanner API Server

Backend server for the Book Scanner app that integrates with Google Books API and caches results in a local SQLite database.

## Features

- **Cache-first approach**: Always checks the database before calling the Google Books API
- **SQLite storage**: Stores all book search results for 30-day caching
- **Multiple search types**: Supports text search, ISBN lookup, and book ID retrieval
- **Automatic normalization**: Converts Google Books API responses to match app's book structure

## Installation

```bash
cd server
npm install
```

## Usage

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on port 3001 by default (configurable via PORT environment variable).

## API Endpoints

### Search Books
```
GET /api/books/search?q=query&maxResults=20
```
Searches for books by text query. Results are cached by query string.

**Parameters:**
- `q` (required): Search query string
- `maxResults` (optional): Maximum results to return (default: 20)

**Response:**
```json
{
  "success": true,
  "query": "search term",
  "totalItems": 100,
  "books": [...],
  "fromCache": false
}
```

### Search by ISBN
```
GET /api/books/isbn/:isbn
```
Searches for a book by ISBN-10 or ISBN-13. Results are cached by ISBN.

**Parameters:**
- `isbn` (required): ISBN-10 or ISBN-13 (hyphens optional)

**Response:**
```json
{
  "success": true,
  "isbn": "9780000000000",
  "book": {...},
  "fromCache": false
}
```

### Get Book by ID
```
GET /api/books/:id
```
Retrieves detailed information for a specific Google Books ID. Results are cached by book ID.

**Parameters:**
- `id` (required): Google Books volume ID

**Response:**
```json
{
  "success": true,
  "book": {...},
  "fromCache": true
}
```

## Database Schema

The server uses SQLite with a single `books_cache` table:

```sql
CREATE TABLE books_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_type TEXT NOT NULL,      -- 'search', 'isbn', or 'book-id'
  query_value TEXT NOT NULL,     -- The query/ISBN/ID value
  response_data TEXT NOT NULL,   -- JSON response data
  created_at INTEGER NOT NULL,   -- Timestamp when cached
  updated_at INTEGER NOT NULL,   -- Timestamp when last updated
  UNIQUE(query_type, query_value)
)
```

## Cache Strategy

- **TTL**: 30 days for all cached entries
- **Update policy**: ON CONFLICT updates existing entries
- **Validation**: Cached data is checked for age before returning

## Environment Variables

- `PORT`: Server port (default: 3001)

## Book Data Structure

The API normalizes Google Books responses to include:

- `id`: Google Books volume ID
- `title`: Book title
- `subtitle`: Book subtitle (if available)
- `authors`: Array of author names
- `author`: Primary author
- `isbn`: Primary ISBN (13 or 10)
- `isbns`: All available ISBNs
- `publisher`: Publisher name
- `publishedDate`: Publication date
- `year`: Publication year
- `pageCount`: Number of pages
- `description`: Book description
- `categories`/`subjects`: Book categories
- `language`: Primary language code
- `thumbnail`/`coverImage`: Cover image URLs
- `averageRating`/`ratingsAverage`: Average user rating
- `ratingsCount`: Number of ratings
- `previewLink`: Google Books preview URL
- `infoLink`: Google Books info page URL
- `source`: Always "google-books"
