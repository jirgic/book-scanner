import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import booksRouter from './routes/books.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
await initDatabase();

// Routes
app.use('/api/books', booksRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Google Books API cache server running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
