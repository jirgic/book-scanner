import { useEffect } from 'react';
import { useLibraryStore } from '../store';
import { getCoverUrl } from '../services/bookApi';
import { X, Trash2, BookOpen, StarRating, Library, ArrowLeft } from './Icons';

export default function LibraryView({ onClose, onBookClick }) {
  const { books, removeBook, clearLibrary } = useLibraryStore();

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <h2 className="text-lg font-semibold text-dark-100">My Library</h2>

          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 overflow-y-auto h-[calc(100vh-72px)]">
        {books.length > 0 ? (
          <>
            {/* Stats */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-dark-500">
                {books.length} {books.length === 1 ? 'book' : 'books'}
              </p>

              {books.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Remove all books from your library?')) {
                      clearLibrary();
                    }
                  }}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Book list */}
            <div className="space-y-3">
              {books
                .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
                .map((book) => (
                  <LibraryBookItem
                    key={book.key}
                    book={book}
                    onRemove={() => removeBook(book.key)}
                    onClick={() => onBookClick?.(book)}
                  />
                ))}
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <Library size={64} className="text-dark-700 mb-4" />
            <h3 className="text-lg font-medium text-dark-300 mb-2">
              Your library is empty
            </h3>
            <p className="text-dark-500 max-w-xs">
              Scan or search for books and add them to your library to keep track
              of them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryBookItem({ book, onRemove, onClick }) {
  const coverUrl = book.coverUrl;

  return (
    <div className="flex items-start gap-4 p-4 bg-dark-800/30 border border-dark-700/50 rounded-xl">
      {/* Cover */}
      <button
        onClick={onClick}
        className="flex-shrink-0 w-16 aspect-[2/3] rounded-lg overflow-hidden bg-dark-700"
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={24} className="text-dark-500" />
          </div>
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <button
          onClick={onClick}
          className="text-left hover:text-primary-400 transition-colors"
        >
          <h3 className="font-medium text-dark-100 line-clamp-2">{book.title}</h3>
        </button>
        <p className="text-sm text-dark-400 truncate mt-0.5">{book.author}</p>

        {book.year && (
          <p className="text-xs text-dark-500 mt-1">{book.year}</p>
        )}

        {book.ratingsAverage && (
          <div className="flex items-center gap-1.5 mt-2">
            <StarRating rating={book.ratingsAverage} size={12} />
            <span className="text-xs text-dark-400">
              {book.ratingsAverage.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        aria-label="Remove from library"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
