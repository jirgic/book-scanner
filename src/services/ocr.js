/**
 * OCR Service using Tesseract.js
 * Handles text recognition from images
 */

import Tesseract from 'tesseract.js';

let worker = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initialize the Tesseract worker
 * @param {string} language - Language code (default: 'eng')
 * @param {function} onProgress - Progress callback
 * @returns {Promise<void>}
 */
export async function initializeWorker(language = 'eng', onProgress = null) {
  // Return existing init promise if already initializing
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // Return if already initialized with same language
  if (worker) {
    return worker;
  }

  isInitializing = true;

  initPromise = (async () => {
    try {
      worker = await Tesseract.createWorker(language, 1, {
        logger: (m) => {
          if (onProgress && m.progress !== undefined) {
            onProgress({
              status: m.status,
              progress: m.progress,
            });
          }
        },
      });

      isInitializing = false;
      return worker;
    } catch (error) {
      isInitializing = false;
      worker = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Recognize text from an image
 * @param {string|HTMLImageElement|HTMLCanvasElement|File|Blob} image - Image source
 * @param {object} options - Recognition options
 * @returns {Promise<object>} Recognition result
 */
export async function recognizeText(image, options = {}) {
  const {
    language = 'eng',
    onProgress = null,
    rectangle = null, // { left, top, width, height } for partial recognition
  } = options;

  // Ensure worker is initialized
  if (!worker) {
    await initializeWorker(language, onProgress);
  }

  const recognizeOptions = {};
  if (rectangle) {
    recognizeOptions.rectangle = rectangle;
  }

  try {
    const result = await worker.recognize(image, recognizeOptions);

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words?.map((w) => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      })) || [],
      lines: result.data.lines?.map((l) => ({
        text: l.text,
        confidence: l.confidence,
        bbox: l.bbox,
      })) || [],
      blocks: result.data.blocks?.map((b) => ({
        text: b.text,
        confidence: b.confidence,
        bbox: b.bbox,
      })) || [],
    };
  } catch (error) {
    console.error('OCR recognition failed:', error);
    throw new Error(`Text recognition failed: ${error.message}`);
  }
}

/**
 * Process image for better OCR results
 * @param {HTMLCanvasElement|HTMLImageElement} source - Image source
 * @returns {HTMLCanvasElement} Processed canvas
 */
export function preprocessImage(source) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Get source dimensions
  const width = source.width || source.videoWidth || source.naturalWidth;
  const height = source.height || source.videoHeight || source.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  // Draw original image
  ctx.drawImage(source, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply preprocessing
  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // Increase contrast
    const contrast = 1.5;
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    const newValue = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

    // Apply threshold for binarization (helps with text)
    const threshold = 128;
    const finalValue = newValue > threshold ? 255 : 0;

    data[i] = finalValue;     // R
    data[i + 1] = finalValue; // G
    data[i + 2] = finalValue; // B
    // Alpha stays the same
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Detect if image might contain vertical text (book spine)
 * @param {object} ocrResult - OCR result with lines
 * @returns {boolean} True if likely vertical text
 */
export function detectVerticalText(ocrResult) {
  if (!ocrResult.lines || ocrResult.lines.length === 0) {
    return false;
  }

  // Check if bounding boxes are taller than wide
  let verticalCount = 0;
  for (const line of ocrResult.lines) {
    if (line.bbox) {
      const width = line.bbox.x1 - line.bbox.x0;
      const height = line.bbox.y1 - line.bbox.y0;
      if (height > width * 2) {
        verticalCount++;
      }
    }
  }

  return verticalCount > ocrResult.lines.length / 2;
}

/**
 * Rotate image for vertical text
 * @param {HTMLCanvasElement|HTMLImageElement} source - Image source
 * @param {number} degrees - Rotation degrees
 * @returns {HTMLCanvasElement} Rotated canvas
 */
export function rotateImage(source, degrees = 90) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;

  if (degrees === 90 || degrees === -90 || degrees === 270) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(source, -width / 2, -height / 2);

  return canvas;
}

/**
 * Terminate the worker
 */
export async function terminateWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
  isInitializing = false;
  initPromise = null;
}

/**
 * Get worker status
 */
export function getWorkerStatus() {
  return {
    initialized: !!worker,
    initializing: isInitializing,
  };
}

export default {
  initializeWorker,
  recognizeText,
  preprocessImage,
  detectVerticalText,
  rotateImage,
  terminateWorker,
  getWorkerStatus,
};
