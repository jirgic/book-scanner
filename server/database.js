import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'books-cache.db');
let db = null;

export function initDatabase() {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create books cache table
  db.exec(`
    CREATE TABLE IF NOT EXISTS books_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_type TEXT NOT NULL,
      query_value TEXT NOT NULL,
      response_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(query_type, query_value)
    )
  `);

  // Create index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_query_lookup
    ON books_cache(query_type, query_value)
  `);

  console.log('Database initialized successfully');
}

export function getCachedBook(queryType, queryValue) {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(`
    SELECT response_data, updated_at
    FROM books_cache
    WHERE query_type = ? AND query_value = ?
  `);

  const result = stmt.get(queryType, queryValue);

  if (result) {
    return {
      data: JSON.parse(result.response_data),
      cachedAt: result.updated_at
    };
  }

  return null;
}

export function setCachedBook(queryType, queryValue, responseData) {
  if (!db) throw new Error('Database not initialized');

  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO books_cache (query_type, query_value, response_data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(query_type, query_value)
    DO UPDATE SET
      response_data = excluded.response_data,
      updated_at = excluded.updated_at
  `);

  stmt.run(queryType, queryValue, JSON.stringify(responseData), now, now);
}

export function getDatabase() {
  return db;
}
