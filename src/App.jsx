import { useState, useCallback, useEffect } from 'react';
import { useAppStore, useLibraryStore, useSettingsStore } from './store';
import { useScanner } from './hooks';
import {
  Header,
  CameraView,
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
  const { showOcrText } = useSettingsStore();

  const scanner = useScanner();

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
