import { useState, useCallback, useEffect } from 'react';
import { useAppStore, useLibraryStore, useSettingsStore } from './store';
import { useScanner, useBarcodeScanner } from './hooks';
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
  const { showOcrText, scanMode } = useSettingsStore();

  const scanner = useScanner();
  const barcodeScanner = useBarcodeScanner();

  // Handle camera/barcode scanner start
  const handleStartCamera = useCallback(async () => {
    try {
      if (scanMode === 'barcode') {
        // Initialize and start barcode scanner
        await barcodeScanner.initialize();
        setMode('camera');

        // Start scanning after a short delay to allow UI to render
        setTimeout(async () => {
          try {
            await barcodeScanner.startScanning(
              async (decodedText, decodedResult) => {
                console.log('Barcode detected:', decodedText);

                // Check if it's an ISBN
                if (barcodeScanner.isISBN(decodedText)) {
                  const isbn = barcodeScanner.formatISBN(decodedText);

                  // Stop scanning
                  await barcodeScanner.stopScanning();

                  // Search by ISBN
                  setMode('processing');
                  setSearchQuery(isbn);

                  try {
                    await scanner.search.searchByISBNAsync(isbn);
                  } catch (error) {
                    console.error('ISBN search failed:', error);
                  }

                  setMode('results');
                } else {
                  // Not an ISBN, but still search with the code
                  console.log('Non-ISBN barcode, searching anyway:', decodedText);
                  await barcodeScanner.stopScanning();
                  setMode('processing');
                  setSearchQuery(decodedText);

                  try {
                    await scanner.search.searchAsync(decodedText);
                  } catch (error) {
                    console.error('Search failed:', error);
                  }

                  setMode('results');
                }
              },
              {
                fps: 10,
                qrbox: { width: 250, height: 100 },
              }
            );
          } catch (err) {
            console.error('Failed to start barcode scanning:', err);
          }
        }, 100);
      } else {
        // Start regular camera for OCR
        await scanner.camera.start();
        setMode('camera');
      }
    } catch (err) {
      console.error('Failed to start camera:', err);
    }
  }, [scanMode, scanner, barcodeScanner, setMode, setSearchQuery]);

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
  const handleCameraClose = useCallback(async () => {
    scanner.camera.stop();
    if (scanMode === 'barcode') {
      await barcodeScanner.cleanup();
    }
    setMode('idle');
  }, [scanner.camera, barcodeScanner, scanMode, setMode]);

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

  // Cleanup OCR worker on unmount
  useEffect(() => {
    return () => {
      scanner.ocr.cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-dark-800 via-dark-900 to-dark-950 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - hidden during camera mode */}
        {mode !== 'camera' && (
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
              onUpload={handleUpload}
              onSkipToSearch={handleSkipToSearch}
            />
          )}

          {/* Camera View - OCR Mode */}
          {mode === 'camera' && scanMode === 'ocr' && (
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
          {mode === 'camera' && scanMode === 'barcode' && (
            <BarcodeView
              scannerId={barcodeScanner.scannerId}
              onClose={handleCameraClose}
              isActive={barcodeScanner.isScanning}
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
        {mode !== 'camera' && (
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
