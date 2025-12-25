import { getCoverUrl } from '../services/openLibrary';
import { getCoverImageUrl } from '../services/googleBooks';
import { StarRating, BookOpen } from './Icons';

export default function BookCard({ book, onClick, className = '' }) {
  // Support both Open Library and Google Books formats
  const coverUrl = book.source === 'google-books'
    ? getCoverImageUrl(book, 'medium')
    : getCoverUrl(book.coverId, 'M');

  return (
    <button
      onClick={() => onClick?.(book)}
      className={`
        group text-left w-full bg-dark-800/30 border border-dark-700/50 
        rounded-xl p-3 hover:bg-dark-800/50 hover:border-dark-600/50
        transition-all duration-200 animate-fade-in
        ${className}
      `}
    >
      {/* Cover */}
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-dark-800 mb-3">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
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
          <BookOpen className="text-dark-500" size={40} />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="font-semibold text-sm text-dark-100 line-clamp-2 group-hover:text-primary-400 transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-dark-400 truncate">{book.author}</p>

        {book.year && (
          <p className="text-xs text-dark-500">{book.year}</p>
        )}

        {book.ratingsAverage && (
          <div className="flex items-center gap-1.5 pt-1">
            <StarRating rating={book.ratingsAverage} size={12} />
            <span className="text-xs text-dark-400">
              {book.ratingsAverage.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

// Skeleton loader for BookCard
export function BookCardSkeleton() {
  return (
    <div className="bg-dark-800/30 border border-dark-700/50 rounded-xl p-3 animate-pulse">
      <div className="aspect-[2/3] rounded-lg bg-dark-700 mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-dark-700 rounded w-full" />
        <div className="h-3 bg-dark-700 rounded w-2/3" />
        <div className="h-3 bg-dark-700 rounded w-1/3" />
      </div>
    </div>
  );
}
