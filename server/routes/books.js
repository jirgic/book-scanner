import express from 'express';
import { searchBooks, searchByISBN, getBookById } from '../services/googleBooks.js';

const router = express.Router();

/**
 * GET /api/books/search?q=query&maxResults=20
 * Search books by query text
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, maxResults = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    const result = await searchBooks(query, parseInt(maxResults));

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/books/isbn/:isbn
 * Search book by ISBN
 */
router.get('/isbn/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;

    if (!isbn) {
      return res.status(400).json({
        error: 'ISBN parameter is required'
      });
    }

    const result = await searchByISBN(isbn);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('ISBN search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/books/:id
 * Get book details by Google Books ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Book ID parameter is required'
      });
    }

    const result = await getBookById(id);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
