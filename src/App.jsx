import { useState, useCallback, useEffect } from 'react';
import { useAppStore, useLibraryStore, useSettingsStore } from './store';
import { useScanner, useBarcode, useBookSearch } from './hooks';
import {
  Header,
  CameraView,
  BarcodeView,
  BookDetail,
  LibraryView,
  SettingsView,
  HomeScreen,
  ProcessingScreen,
  ResultsScreen,
} from './components';
import { formatISBN, isISBN } from './services/barcode';

export default function App() {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    mode,
    setMode,
    capturedImage,
    ocrText,
    ocrProgress,
    ocrStatus,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    selectedBook,
    setSelectedBook,
  } = useAppStore();

  const { books } = useLibraryStore();
  const { showOcrText } = useSettingsStore();

  const scanner = useScanner();
  const barcode = useBarcode();
  const bookSearch = useBookSearch();

  // Handle barcode scan start
  const handleStartBarcode = useCallback(async () => {
    try {
      await barcode.initialize();
      setMode('barcode');
      // Wait a bit for the scanner element to render
      setTimeout(async () => {
        await barcode.start(handleBarcodeScan);
      }, 100);
    } catch (err) {
      console.error('Failed to start barcode scanner:', err);
    }
  }, [barcode, setMode]);

  // Handle barcode scan success
  const handleBarcodeScan = useCallback(async (decodedText) => {
    try {
      console.log('Barcode scanned:', decodedText);

      // Check if it's an ISBN
      const isbn = formatISBN(decodedText);
      if (!isbn || !isISBN(decodedText)) {
        console.warn('Scanned barcode is not an ISBN:', decodedText);
        return;
      }

      // Stop barcode scanner
      await barcode.stop();
      await barcode.cleanup();

      // Set mode to processing
      setMode('processing');

      // Lookup ISBN
      const book = await bookSearch.searchByISBNAsync(isbn);

      if (book) {
        // Show book details
        setSelectedBook(book);
      } else {
        // Show error or no results
        setMode('results');
      }

      // Reset to idle
      setMode('idle');
    } catch (err) {
      console.error('Barcode scan processing failed:', err);
      setMode('idle');
    }
  }, [barcode, bookSearch, setMode, setSelectedBook]);

  // Handle barcode close
  const handleBarcodeClose = useCallback(async () => {
    await barcode.stop();
    await barcode.cleanup();
    setMode('idle');
  }, [barcode, setMode]);

  // Handle camera start
  const handleStartCamera = useCallback(async () => {
    try {
      await scanner.camera.start();
      setMode('camera');
    } catch (err) {
      console.error('Failed to start camera:', err);
    }
  }, [scanner.camera, setMode]);

  // Handle image capture
  const handleCapture = useCallback(async () => {
    try {
      await scanner.captureAndProcess();
    } catch (err) {
      console.error('Capture failed:', err);
    }
  }, [scanner]);

  // Handle file upload
  const handleUpload = useCallback(
    async (file) => {
      try {
        await scanner.processUploadedImage(file);
      } catch (err) {
        console.error('Upload processing failed:', err);
      }
    },
    [scanner]
  );

  // Handle manual search
  const handleSearch = useCallback(
    async (query) => {
      await scanner.manualSearch(query);
    },
    [scanner]
  );

  // Skip to search (no camera)
  const handleSkipToSearch = useCallback(() => {
    setMode('results');
  }, [setMode]);

  // Handle camera close
  const handleCameraClose = useCallback(() => {
    scanner.camera.stop();
    setMode('idle');
  }, [scanner.camera, setMode]);

  // Handle back/reset
  const handleBack = useCallback(() => {
    scanner.reset();
  }, [scanner]);

  // Handle book click from library
  const handleLibraryBookClick = useCallback(
    (book) => {
      setSelectedBook(book);
      setShowLibrary(false);
    },
    [setSelectedBook]
  );

  // Cleanup OCR worker and barcode scanner on unmount
  useEffect(() => {
    return () => {
      scanner.ocr.cleanup();
      barcode.cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-dark-800 via-dark-900 to-dark-950 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - hidden during camera and barcode modes */}
        {mode !== 'camera' && mode !== 'barcode' && (
          <Header
            onLibraryClick={() => setShowLibrary(true)}
            onSettingsClick={() => setShowSettings(true)}
            libraryCount={books.length}
          />
        )}

        {/* Main area */}
        <main className="flex-1 max-w-2xl mx-auto w-full">
          {/* Idle / Home Screen */}
          {mode === 'idle' && (
            <HomeScreen
              onStartCamera={handleStartCamera}
              onStartBarcode={handleStartBarcode}
              onUpload={handleUpload}
              onSkipToSearch={handleSkipToSearch}
            />
          )}

          {/* Camera View */}
          {mode === 'camera' && (
            <CameraView
              videoRef={scanner.camera.videoRef}
              canvasRef={scanner.camera.canvasRef}
              onCapture={handleCapture}
              onClose={handleCameraClose}
              onSwitchCamera={scanner.camera.switchCamera}
              isActive={scanner.camera.isActive}
            />
          )}

          {/* Barcode Scanner View */}
          {mode === 'barcode' && (
            <BarcodeView
              scannerId={barcode.scannerId}
              onScanSuccess={handleBarcodeScan}
              onClose={handleBarcodeClose}
              isActive={barcode.isActive}
            />
          )}

          {/* Processing Screen */}
          {mode === 'processing' && (
            <ProcessingScreen
              image={capturedImage}
              ocrProgress={ocrProgress}
              ocrStatus={ocrStatus}
            />
          )}

          {/* Results Screen */}
          {mode === 'results' && (
            <ResultsScreen
              image={capturedImage}
              ocrText={ocrText}
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              searchError={searchError}
              showOcrText={showOcrText}
              onSearchChange={setSearchQuery}
              onSearch={handleSearch}
              onBookClick={setSelectedBook}
              onBack={handleBack}
            />
          )}
        </main>

        {/* Footer */}
        {mode !== 'camera' && mode !== 'barcode' && (
          <footer className="text-center py-4 text-xs text-dark-600">
            Powered by Open Library & Tesseract.js
          </footer>
        )}
      </div>

      {/* Modals */}

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetail
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Library View */}
      {showLibrary && (
        <LibraryView
          onClose={() => setShowLibrary(false)}
          onBookClick={handleLibraryBookClick}
        />
      )}

      {/* Settings View */}
      {showSettings && (
        <SettingsView onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
