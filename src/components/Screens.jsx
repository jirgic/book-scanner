import { useRef } from 'react';
import { Camera, Upload, Search, Scan, ArrowLeft, AlertCircle, Spinner } from './Icons';
import BookCard, { BookCardSkeleton } from './BookCard';
import SearchBar, { QuickSearch } from './SearchBar';

// Home Screen (Idle state)
export function HomeScreen({ onStartCamera, onStartBarcode, onUpload, onSkipToSearch }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload?.(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">📷</div>
        <h2 className="text-2xl font-serif font-semibold text-dark-100 mb-2">
          Scan a Book
        </h2>
        <p className="text-dark-400 max-w-xs mx-auto">
          Scan a barcode, take a photo, or search manually
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <button onClick={onStartBarcode} className="btn-primary w-full py-3">
          <Scan size={20} className="inline mr-2" />
          Scan Barcode
        </button>

        <button onClick={onStartCamera} className="btn-secondary w-full py-3">
          <Camera size={20} className="inline mr-2" />
          Scan Cover/Spine
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary w-full py-3"
        >
          <Upload size={20} className="inline mr-2" />
          Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button onClick={onSkipToSearch} className="btn-ghost w-full py-3">
          <Search size={20} className="inline mr-2" />
          Search Manually
        </button>
      </div>

      {/* Features */}
      <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-dark-500">
        <div className="flex items-center gap-2">
          <Scan size={16} className="text-primary-500" />
          <span>OCR Recognition</span>
        </div>
        <div className="flex items-center gap-2">
          <Search size={16} className="text-primary-500" />
          <span>Open Library</span>
        </div>
      </div>
    </div>
  );
}

// Processing Screen
export function ProcessingScreen({ image, ocrProgress, ocrStatus }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 animate-fade-in">
      {/* Preview image */}
      {image && (
        <div className="w-40 aspect-[3/4] rounded-lg overflow-hidden shadow-xl mb-6">
          <img src={image} alt="Captured" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Progress */}
      <div className="text-center">
        <Spinner size={40} className="text-primary-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-dark-100 mb-2">
          {ocrStatus === 'loading'
            ? 'Initializing OCR...'
            : ocrStatus === 'processing'
            ? 'Reading text...'
            : 'Searching books...'}
        </h3>

        {ocrProgress > 0 && ocrProgress < 100 && (
          <div className="w-48 mx-auto">
            <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <p className="text-sm text-dark-500 mt-2">{ocrProgress}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Results Screen
export function ResultsScreen({
  image,
  ocrText,
  searchQuery,
  searchResults,
  isSearching,
  searchError,
  showOcrText,
  onSearchChange,
  onSearch,
  onBookClick,
  onBack,
}) {
  const quickSearchTerms = ['Fiction', 'Science', 'History', 'Fantasy', 'Biography'];

  return (
    <div className="px-4 py-4 animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        New Scan
      </button>

      {/* Captured image preview */}
      {image && (
        <div className="flex justify-center mb-4">
          <div className="w-24 aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
            <img src={image} alt="Captured" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* OCR Text display */}
      {showOcrText && ocrText && (
        <div className="card mb-4">
          <h4 className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-2">
            Detected Text
          </h4>
          <p className="text-sm text-dark-300 font-mono whitespace-pre-wrap line-clamp-3">
            {ocrText}
          </p>
        </div>
      )}

      {/* Search bar */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          onSubmit={onSearch}
          isLoading={isSearching}
          placeholder="Search by title, author, or ISBN..."
          autoFocus={!image}
        />
      </div>

      {/* Quick search suggestions */}
      {!searchQuery && !searchResults.length && (
        <div className="mb-6">
          <QuickSearch suggestions={quickSearchTerms} onSelect={onSearch} />
        </div>
      )}

      {/* Error */}
      {searchError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-4">
          <AlertCircle size={20} />
          <p className="text-sm">{searchError}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isSearching && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results grid */}
      {!isSearching && searchResults.length > 0 && (
        <>
          <p className="text-sm text-dark-500 mb-3">
            Found {searchResults.length} results
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {searchResults.map((book, index) => (
              <BookCard
                key={book.key + index}
                book={book}
                onClick={onBookClick}
              />
            ))}
          </div>
        </>
      )}

      {/* No results */}
      {!isSearching && searchQuery && searchResults.length === 0 && !searchError && (
        <div className="text-center py-12">
          <Search size={48} className="mx-auto text-dark-600 mb-4" />
          <p className="text-dark-400">No books found</p>
          <p className="text-sm text-dark-500 mt-1">Try different search terms</p>
        </div>
      )}

      {/* Empty state */}
      {!isSearching && !searchQuery && !searchResults.length && !image && (
        <div className="text-center py-12">
          <Search size={48} className="mx-auto text-dark-600 mb-4" />
          <p className="text-dark-400">Search for books above</p>
        </div>
      )}
    </div>
  );
}
