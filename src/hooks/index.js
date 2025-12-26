import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppStore, useSettingsStore } from '../store';
import * as bookApi from '../services/bookApi';
import * as ocr from '../services/ocr';

/**
 * Hook for camera functionality
 */
export function useCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);

  const preferredCamera = useSettingsStore((s) => s.preferredCamera);

  // Get available cameras
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === 'videoinput');
      setDevices(cameras);
      return cameras;
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
      return [];
    }
  }, []);

  // Start camera
  const start = useCallback(async (deviceId = null) => {
    try {
      setError(null);

      const constraints = {
        video: {
          facingMode: preferredCamera,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      if (deviceId) {
        constraints.video = { deviceId: { exact: deviceId } };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      await getDevices();

      return stream;
    } catch (err) {
      const message =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err.message}`;

      setError(message);
      throw new Error(message);
    }
  }, [preferredCamera, getDevices]);

  // Stop camera
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  // Capture image
  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      throw new Error('Camera not initialized');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    const newFacing = preferredCamera === 'environment' ? 'user' : 'environment';
    useSettingsStore.getState().setPreferredCamera(newFacing);

    if (isActive) {
      stop();
      await start();
    }
  }, [preferredCamera, isActive, stop, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    canvasRef,
    isActive,
    error,
    devices,
    start,
    stop,
    capture,
    switchCamera,
    getDevices,
  };
}

/**
 * Hook for OCR functionality
 */
export function useOCR() {
  const { setOcrText, setOcrProgress, setOcrStatus } = useAppStore();
  const ocrLanguage = useSettingsStore((s) => s.ocrLanguage);

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize worker
  const initialize = useCallback(async () => {
    try {
      setOcrStatus('loading');
      await ocr.initializeWorker(ocrLanguage, ({ status, progress }) => {
        if (status === 'recognizing text') {
          setOcrProgress(Math.round(progress * 100));
        }
      });
      setIsInitialized(true);
      setOcrStatus('idle');
    } catch (err) {
      setOcrStatus('error');
      throw err;
    }
  }, [ocrLanguage, setOcrProgress, setOcrStatus]);

  // Process image with OCR
  const processImage = useCallback(
    async (imageSource, options = {}) => {
      try {
        setOcrStatus('processing');
        setOcrProgress(0);

        // Initialize if needed
        if (!isInitialized) {
          await initialize();
        }

        // Preprocess if requested
        let processedImage = imageSource;
        if (options.preprocess) {
          // Load image if it's a URL
          if (typeof imageSource === 'string') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imageSource;
            });
            processedImage = ocr.preprocessImage(img);
          } else {
            processedImage = ocr.preprocessImage(imageSource);
          }
        }

        // Recognize text
        const result = await ocr.recognizeText(processedImage, {
          language: ocrLanguage,
          onProgress: ({ progress }) => {
            setOcrProgress(Math.round(progress * 100));
          },
        });

        // Check for vertical text (book spines)
        if (result.confidence < 50 && ocr.detectVerticalText(result)) {
          // Try rotated image
          const rotated = ocr.rotateImage(processedImage, 90);
          const rotatedResult = await ocr.recognizeText(rotated);

          if (rotatedResult.confidence > result.confidence) {
            setOcrText(rotatedResult.text);
            setOcrStatus('complete');
            return rotatedResult;
          }
        }

        setOcrText(result.text);
        setOcrStatus('complete');
        return result;
      } catch (err) {
        setOcrStatus('error');
        throw err;
      }
    },
    [isInitialized, initialize, ocrLanguage, setOcrText, setOcrProgress, setOcrStatus]
  );

  // Cleanup
  const cleanup = useCallback(async () => {
    await ocr.terminateWorker();
    setIsInitialized(false);
    setOcrStatus('idle');
  }, [setOcrStatus]);

  return {
    isInitialized,
    initialize,
    processImage,
    cleanup,
    status: ocr.getWorkerStatus(),
  };
}

/**
 * Hook for book search
 */
export function useBookSearch() {
  const { setSearchResults, setIsSearching, setSearchError } = useAppStore();

  const searchMutation = useMutation({
    mutationFn: async (query) => {
      const result = await bookApi.searchBooks(query, { limit: 20, source: 'all' });
      return result.books;
    },
    onMutate: () => {
      setIsSearching(true);
      setSearchError(null);
    },
    onSuccess: (books) => {
      setSearchResults(books);
      setIsSearching(false);
    },
    onError: (error) => {
      setSearchError(error.message);
      setIsSearching(false);
    },
  });

  const searchByISBNMutation = useMutation({
    mutationFn: bookApi.lookupISBN,
  });

  return {
    search: searchMutation.mutate,
    searchAsync: searchMutation.mutateAsync,
    searchByISBN: searchByISBNMutation.mutate,
    searchByISBNAsync: searchByISBNMutation.mutateAsync,
    isSearching: searchMutation.isPending,
    error: searchMutation.error,
    reset: () => {
      searchMutation.reset();
      setSearchResults([]);
      setSearchError(null);
    },
  };
}

/**
 * Hook for book details
 */
export function useBookDetails(bookKey) {
  return useQuery({
    queryKey: ['book', bookKey],
    queryFn: () => bookApi.getBookDetails(bookKey),
    enabled: !!bookKey,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Combined hook for scanning workflow
 */
export function useScanner() {
  const camera = useCamera();
  const ocrHook = useOCR();
  const bookSearch = useBookSearch();

  const {
    mode,
    setMode,
    capturedImage,
    setCapturedImage,
    ocrText,
    searchQuery,
    setSearchQuery,
    resetAll,
  } = useAppStore();

  const autoSearch = useSettingsStore((s) => s.autoSearch);

  // Capture and process
  const captureAndProcess = useCallback(async () => {
    try {
      // Capture image
      const imageData = camera.capture();
      setCapturedImage(imageData);
      camera.stop();

      // Set mode to processing
      setMode('processing');

      // Run OCR
      const result = await ocrHook.processImage(imageData, { preprocess: true });

      // Prepare search query
      const query = bookApi.prepareSearchQuery(result.text);
      setSearchQuery(query);

      // Auto search if enabled and we have text
      if (autoSearch && query) {
        await bookSearch.searchAsync(query);
      }

      // Go to results
      setMode('results');

      return result;
    } catch (err) {
      console.error('Capture and process failed:', err);
      setMode('results');
      throw err;
    }
  }, [
    camera,
    setCapturedImage,
    setMode,
    ocrHook,
    setSearchQuery,
    autoSearch,
    bookSearch,
  ]);

  // Process uploaded image
  const processUploadedImage = useCallback(
    async (file) => {
      try {
        // Read file
        const imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setCapturedImage(imageData);
        setMode('processing');

        // Run OCR
        const result = await ocrHook.processImage(imageData, { preprocess: true });

        // Prepare search query
        const query = bookApi.prepareSearchQuery(result.text);
        setSearchQuery(query);

        // Auto search if enabled
        if (autoSearch && query) {
          await bookSearch.searchAsync(query);
        }

        setMode('results');
        return result;
      } catch (err) {
        console.error('Process uploaded image failed:', err);
        setMode('results');
        throw err;
      }
    },
    [setCapturedImage, setMode, ocrHook, setSearchQuery, autoSearch, bookSearch]
  );

  // Manual search
  const manualSearch = useCallback(
    async (query) => {
      setSearchQuery(query);
      if (query.trim()) {
        await bookSearch.searchAsync(query);
      }
    },
    [setSearchQuery, bookSearch]
  );

  // Reset everything
  const reset = useCallback(() => {
    camera.stop();
    resetAll();
  }, [camera, resetAll]);

  return {
    // State
    mode,
    capturedImage,
    ocrText,
    searchQuery,

    // Camera
    camera,

    // OCR
    ocr: ocrHook,

    // Search
    search: bookSearch,

    // Actions
    setMode,
    captureAndProcess,
    processUploadedImage,
    manualSearch,
    reset,
  };
}

export default {
  useCamera,
  useOCR,
  useBookSearch,
  useBookDetails,
  useScanner,
};
