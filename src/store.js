import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Main app store
export const useAppStore = create((set, get) => ({
  // UI State
  mode: 'idle', // 'idle' | 'camera' | 'processing' | 'results'
  setMode: (mode) => set({ mode }),

  // Captured image
  capturedImage: null,
  setCapturedImage: (image) => set({ capturedImage: image }),

  // OCR State
  ocrText: '',
  ocrProgress: 0,
  ocrStatus: 'idle', // 'idle' | 'loading' | 'processing' | 'complete' | 'error'
  setOcrText: (text) => set({ ocrText: text }),
  setOcrProgress: (progress) => set({ ocrProgress: progress }),
  setOcrStatus: (status) => set({ ocrStatus: status }),

  // Search State
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  searchError: null,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setSearchError: (error) => set({ searchError: error }),

  // Selected Book
  selectedBook: null,
  setSelectedBook: (book) => set({ selectedBook: book }),

  // Reset functions
  resetCapture: () => set({
    capturedImage: null,
    ocrText: '',
    ocrProgress: 0,
    ocrStatus: 'idle',
  }),

  resetSearch: () => set({
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    searchError: null,
  }),

  resetAll: () => set({
    mode: 'idle',
    capturedImage: null,
    ocrText: '',
    ocrProgress: 0,
    ocrStatus: 'idle',
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    searchError: null,
    selectedBook: null,
  }),
}));

// Library store (persisted)
export const useLibraryStore = create(
  persist(
    (set, get) => ({
      books: [],
      
      addBook: (book) => {
        const exists = get().books.some((b) => b.key === book.key);
        if (!exists) {
          set({ books: [...get().books, { ...book, addedAt: Date.now() }] });
          return true;
        }
        return false;
      },

      removeBook: (bookKey) => {
        set({ books: get().books.filter((b) => b.key !== bookKey) });
      },

      isInLibrary: (bookKey) => {
        return get().books.some((b) => b.key === bookKey);
      },

      clearLibrary: () => set({ books: [] }),
    }),
    {
      name: 'book-scanner-library',
    }
  )
);

// Settings store (persisted)
export const useSettingsStore = create(
  persist(
    (set) => ({
      // OCR Settings
      ocrLanguage: 'eng',
      setOcrLanguage: (lang) => set({ ocrLanguage: lang }),

      // Camera Settings
      preferredCamera: 'environment', // 'environment' | 'user'
      setPreferredCamera: (camera) => set({ preferredCamera: camera }),

      // UI Settings
      showOcrText: true,
      setShowOcrText: (show) => set({ showOcrText: show }),

      autoSearch: true,
      setAutoSearch: (auto) => set({ autoSearch: auto }),

      // Search Settings
      searchSource: 'combined', // 'combined' | 'google' | 'hardcover' | 'openlibrary'
      setSearchSource: (source) => set({ searchSource: source }),
    }),
    {
      name: 'book-scanner-settings',
    }
  )
);
