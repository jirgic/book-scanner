import { useState, useRef } from 'react';
import { Search, X, Spinner } from './Icons';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = 'Search books...',
  autoFocus = false,
}) {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit?.(value.trim());
    }
  };

  const handleClear = () => {
    onChange?.('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        {/* Search icon */}
        <div className="absolute left-4 text-dark-500">
          {isLoading ? (
            <Spinner size={18} className="text-primary-500" />
          ) : (
            <Search size={18} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="input pl-11 pr-20"
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-16 p-1 text-dark-500 hover:text-dark-300 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="absolute right-2 px-3 py-1.5 text-sm font-medium bg-primary-500 text-dark-900 rounded-md hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}

// Quick search suggestions
export function QuickSearch({ suggestions, onSelect }) {
  if (!suggestions?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {suggestions.map((term) => (
        <button
          key={term}
          onClick={() => onSelect(term)}
          className="px-3 py-1.5 text-xs font-medium bg-dark-800/50 border border-dark-700 rounded-full text-dark-400 hover:text-dark-200 hover:border-dark-500 transition-colors"
        >
          {term}
        </button>
      ))}
    </div>
  );
}
