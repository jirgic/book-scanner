import { useEffect } from 'react';
import { useSettingsStore, useLibraryStore } from '../store';
import { ArrowLeft, Check } from './Icons';

export default function SettingsView({ onClose }) {
  const settings = useSettingsStore();
  const { books, clearLibrary } = useLibraryStore();

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

          <h2 className="text-lg font-semibold text-dark-100">Settings</h2>

          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* OCR Settings */}
        <section>
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
            OCR Settings
          </h3>
          <div className="card space-y-4">
            {/* Language */}
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                Recognition Language
              </label>
              <select
                value={settings.ocrLanguage}
                onChange={(e) => settings.setOcrLanguage(e.target.value)}
                className="input"
              >
                <option value="eng">English</option>
                <option value="deu">German</option>
                <option value="fra">French</option>
                <option value="spa">Spanish</option>
                <option value="ita">Italian</option>
                <option value="por">Portuguese</option>
                <option value="rus">Russian</option>
                <option value="jpn">Japanese</option>
                <option value="chi_sim">Chinese (Simplified)</option>
                <option value="chi_tra">Chinese (Traditional)</option>
                <option value="kor">Korean</option>
                <option value="ara">Arabic</option>
              </select>
            </div>

            {/* Auto Search */}
            <ToggleSetting
              label="Auto-search after OCR"
              description="Automatically search when text is recognized"
              checked={settings.autoSearch}
              onChange={settings.setAutoSearch}
            />

            {/* Show OCR Text */}
            <ToggleSetting
              label="Show detected text"
              description="Display recognized text in results"
              checked={settings.showOcrText}
              onChange={settings.setShowOcrText}
            />
          </div>
        </section>

        {/* Search Settings */}
        <section>
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
            Search Settings
          </h3>
          <div className="card">
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                Book Database
              </label>
              <select
                value={settings.searchSource}
                onChange={(e) => settings.setSearchSource(e.target.value)}
                className="input"
              >
                <option value="combined">All Sources (Combined)</option>
                <option value="google">Google Books</option>
                <option value="hardcover">Hardcover</option>
                <option value="openlibrary">Open Library</option>
              </select>
              <p className="text-xs text-dark-500 mt-2">
                {settings.searchSource === 'combined' && 'Search all databases and combine results'}
                {settings.searchSource === 'google' && 'Fast, comprehensive book data with ratings'}
                {settings.searchSource === 'hardcover' && 'Community-driven database with social features'}
                {settings.searchSource === 'openlibrary' && 'Extensive catalog with multiple editions'}
              </p>
            </div>
          </div>
        </section>

        {/* Camera Settings */}
        <section>
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
            Camera Settings
          </h3>
          <div className="card">
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                Preferred Camera
              </label>
              <select
                value={settings.preferredCamera}
                onChange={(e) => settings.setPreferredCamera(e.target.value)}
                className="input"
              >
                <option value="environment">Back Camera</option>
                <option value="user">Front Camera</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
            Data Management
          </h3>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-300">Library</p>
                <p className="text-xs text-dark-500">
                  {books.length} {books.length === 1 ? 'book' : 'books'} saved
                </p>
              </div>
              <button
                onClick={() => {
                  if (books.length > 0 && confirm('Clear your entire library?')) {
                    clearLibrary();
                  }
                }}
                disabled={books.length === 0}
                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Library
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-300">Settings</p>
                <p className="text-xs text-dark-500">Reset to defaults</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Reset all settings to defaults?')) {
                    settings.setOcrLanguage('eng');
                    settings.setPreferredCamera('environment');
                    settings.setShowOcrText(true);
                    settings.setAutoSearch(true);
                    settings.setSearchSource('combined');
                  }
                }}
                className="px-3 py-1.5 text-sm text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
            About
          </h3>
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📚</span>
              <div>
                <h4 className="font-semibold text-dark-100">BookLens</h4>
                <p className="text-xs text-dark-500">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-sm text-dark-400 mb-4">
              Scan book covers and spines to find book information, ratings, and
              more using OCR and multiple book databases.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="https://books.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Google Books
              </a>
              <span className="text-dark-600">•</span>
              <a
                href="https://hardcover.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Hardcover
              </a>
              <span className="text-dark-600">•</span>
              <a
                href="https://openlibrary.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Open Library
              </a>
              <span className="text-dark-600">•</span>
              <a
                href="https://github.com/naptha/tesseract.js"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Tesseract.js
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Toggle setting component
function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-dark-300">{label}</p>
        {description && (
          <p className="text-xs text-dark-500">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-500' : 'bg-dark-600'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
