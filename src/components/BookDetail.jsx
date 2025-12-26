import { useEffect } from 'react';
import { getCoverUrl } from '../services/bookApi';
import { useLibraryStore } from '../store';
import {
  X,
  StarRating,
  ExternalLink,
  BookOpen,
  Calendar,
  Building,
  Hash,
  Globe,
  Plus,
  Check,
  BookMarked,
} from './Icons';

export default function BookDetail({ book, onClose }) {
  const { addBook, removeBook, isInLibrary } = useLibraryStore();
  const inLibrary = isInLibrary(book.key);
  const coverUrl = book.coverUrlLarge || book.coverUrl;

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleLibraryToggle = () => {
    if (inLibrary) {
      removeBook(book.key);
    } else {
      addBook(book);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-b from-dark-800 to-dark-900 rounded-2xl border border-dark-700/50 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-dark-700/80 text-dark-300 hover:bg-dark-600 hover:text-dark-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Cover */}
          <div className="w-32 aspect-[2/3] mx-auto mb-6 rounded-lg overflow-hidden shadow-xl">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-700 to-dark-800 ${
                coverUrl ? 'hidden' : ''
              }`}
            >
              <BookOpen className="text-dark-500" size={48} />
            </div>
          </div>

          {/* Title & Author */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-serif font-semibold text-dark-100 mb-2">
              {book.title}
            </h2>
            <p className="text-dark-400">
              by {book.authors?.join(', ') || book.author}
            </p>
          </div>

          {/* Rating */}
          {book.ratingsAverage && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <StarRating rating={book.ratingsAverage} size={20} />
              <span className="text-lg font-semibold text-amber-400">
                {book.ratingsAverage.toFixed(2)}
              </span>
              {book.ratingsCount && (
                <span className="text-sm text-dark-500">
                  ({book.ratingsCount.toLocaleString()} ratings)
                </span>
              )}
            </div>
          )}

          {/* Add to Library Button */}
          <button
            onClick={handleLibraryToggle}
            className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all mb-6 ${
              inLibrary
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'btn-primary'
            }`}
          >
            {inLibrary ? (
              <>
                <Check size={20} />
                In Your Library
              </>
            ) : (
              <>
                <Plus size={20} />
                Add to Library
              </>
            )}
          </button>

          {/* Details */}
          <div className="space-y-3 mb-6">
            {book.year && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-dark-500" />
                <span className="text-dark-400">First published:</span>
                <span className="text-dark-200">{book.year}</span>
              </div>
            )}

            {book.editionCount && (
              <div className="flex items-center gap-3 text-sm">
                <BookMarked size={16} className="text-dark-500" />
                <span className="text-dark-400">Editions:</span>
                <span className="text-dark-200">
                  {book.editionCount.toLocaleString()}
                </span>
              </div>
            )}

            {book.publisher && (
              <div className="flex items-center gap-3 text-sm">
                <Building size={16} className="text-dark-500" />
                <span className="text-dark-400">Publisher:</span>
                <span className="text-dark-200">{book.publisher}</span>
              </div>
            )}

            {book.isbn && (
              <div className="flex items-center gap-3 text-sm">
                <Hash size={16} className="text-dark-500" />
                <span className="text-dark-400">ISBN:</span>
                <span className="text-dark-200 font-mono text-xs">
                  {book.isbn}
                </span>
              </div>
            )}

            {book.pageCount && (
              <div className="flex items-center gap-3 text-sm">
                <BookOpen size={16} className="text-dark-500" />
                <span className="text-dark-400">Pages:</span>
                <span className="text-dark-200">{book.pageCount}</span>
              </div>
            )}

            {book.language && (
              <div className="flex items-center gap-3 text-sm">
                <Globe size={16} className="text-dark-500" />
                <span className="text-dark-400">Language:</span>
                <span className="text-dark-200 uppercase">{book.language}</span>
              </div>
            )}
          </div>

          {/* Subjects */}
          {book.subjects?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-2">
                Subjects
              </h3>
              <div className="flex flex-wrap gap-2">
                {book.subjects.slice(0, 8).map((subject, i) => (
                  <span key={i} className="tag">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Link */}
          <a
            href={book.infoLink || `https://openlibrary.org${book.key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            View on {book.source === 'google' ? 'Google Books' : 'Open Library'}
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
