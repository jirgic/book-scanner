import { Library, Settings } from './Icons';

export default function Header({ onLibraryClick, onSettingsClick, libraryCount = 0 }) {
  return (
    <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-lg border-b border-dark-800">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <h1 className="text-xl font-serif font-semibold text-gradient">
            BookLens
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onLibraryClick && (
            <button
              onClick={onLibraryClick}
              className="relative p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-colors"
              aria-label="My Library"
            >
              <Library size={20} />
              {libraryCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold bg-primary-500 text-dark-900 rounded-full">
                  {libraryCount > 99 ? '99+' : libraryCount}
                </span>
              )}
            </button>
          )}

          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
