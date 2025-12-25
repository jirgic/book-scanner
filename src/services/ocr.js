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
 * Apply sharpening filter to image data
 * @param {ImageData} imageData - Image data to sharpen
 * @returns {ImageData} Sharpened image data
 */
function applySharpen(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new ImageData(width, height);
  const outData = output.data;

  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4 + c;
        outData[idx] = Math.min(255, Math.max(0, sum));
      }
      // Copy alpha
      const idx = (y * width + x) * 4;
      outData[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/**
 * Calculate adaptive threshold using Otsu's method
 * @param {Uint8ClampedArray} data - Grayscale pixel data
 * @returns {number} Optimal threshold value
 */
function calculateOtsuThreshold(data) {
  const histogram = new Array(256).fill(0);
  const total = data.length / 4;

  // Build histogram
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;

    wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }

  return threshold;
}

/**
 * Process image for better OCR results
 * @param {HTMLCanvasElement|HTMLImageElement} source - Image source
 * @param {object} options - Processing options
 * @returns {HTMLCanvasElement} Processed canvas
 */
export function preprocessImage(source, options = {}) {
  const {
    sharpen = true,
    adaptiveThreshold = true,
    contrastLevel = 1.5,
    denoise = true,
  } = options;

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
  let imageData = ctx.getImageData(0, 0, width, height);

  // Apply sharpening first if enabled
  if (sharpen) {
    imageData = applySharpen(imageData);
  }

  const data = imageData.data;

  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // Denoise using simple median-like approach
  if (denoise) {
    const tempData = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            neighbors.push(tempData[idx]);
          }
        }
        neighbors.sort((a, b) => a - b);
        const median = neighbors[4]; // Middle value of 9 neighbors
        const idx = (y * width + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = median;
      }
    }
  }

  // Calculate threshold
  let threshold = 128;
  if (adaptiveThreshold) {
    threshold = calculateOtsuThreshold(data);
  }

  // Apply contrast and binarization
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i];

    // Increase contrast
    const factor = (259 * (contrastLevel * 255 + 255)) / (255 * (259 - contrastLevel * 255));
    const enhanced = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

    // Apply threshold for binarization
    const finalValue = enhanced > threshold ? 255 : 0;

    data[i] = finalValue;     // R
    data[i + 1] = finalValue; // G
    data[i + 2] = finalValue; // B
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
 * Detect skew angle using projection profile method
 * @param {HTMLCanvasElement} canvas - Canvas with image
 * @returns {number} Estimated skew angle in degrees
 */
function detectSkewAngle(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let maxVariance = 0;
  let bestAngle = 0;

  // Test angles from -15 to +15 degrees
  for (let angle = -15; angle <= 15; angle += 0.5) {
    const rad = (angle * Math.PI) / 180;
    const projection = new Array(canvas.height).fill(0);

    // Calculate horizontal projection at this angle
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        if (data[idx] < 128) { // Black pixels
          const projY = Math.round(y + x * Math.tan(rad));
          if (projY >= 0 && projY < canvas.height) {
            projection[projY]++;
          }
        }
      }
    }

    // Calculate variance of projection
    const mean = projection.reduce((a, b) => a + b, 0) / projection.length;
    const variance = projection.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / projection.length;

    if (variance > maxVariance) {
      maxVariance = variance;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

/**
 * Deskew image by correcting rotation
 * @param {HTMLCanvasElement|HTMLImageElement} source - Image source
 * @returns {HTMLCanvasElement} Deskewed canvas
 */
export function deskewImage(source) {
  // First convert to canvas if needed
  let canvas;
  if (source instanceof HTMLCanvasElement) {
    canvas = source;
  } else {
    canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = source.width || source.naturalWidth;
    const height = source.height || source.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(source, 0, 0);
  }

  // Detect skew angle
  const angle = detectSkewAngle(canvas);

  // Only apply correction if angle is significant
  if (Math.abs(angle) < 0.5) {
    return canvas;
  }

  // Create new canvas for deskewed image
  const result = document.createElement('canvas');
  const ctx = result.getContext('2d');

  // Calculate new dimensions to fit rotated image
  const rad = Math.abs((angle * Math.PI) / 180);
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const newWidth = Math.ceil(canvas.width * cos + canvas.height * sin);
  const newHeight = Math.ceil(canvas.width * sin + canvas.height * cos);

  result.width = newWidth;
  result.height = newHeight;

  // Apply rotation
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate((-angle * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return result;
}

/**
 * Perform OCR with multiple passes using different orientations and preprocessing
 * @param {string|HTMLImageElement|HTMLCanvasElement|File|Blob} image - Image source
 * @param {object} options - Recognition options
 * @returns {Promise<object>} Best recognition result
 */
export async function recognizeTextMultiPass(image, options = {}) {
  const {
    language = 'eng',
    onProgress = null,
    tryRotations = true,
    tryPreprocessing = true,
  } = options;

  // Ensure worker is initialized
  if (!worker) {
    await initializeWorker(language, onProgress);
  }

  // Load image if it's a string (URL/data URL)
  let imgElement = image;
  if (typeof image === 'string') {
    imgElement = new Image();
    imgElement.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      imgElement.onload = resolve;
      imgElement.onerror = reject;
      imgElement.src = image;
    });
  }

  const results = [];
  let totalPasses = 1;

  // Calculate total passes for progress tracking
  if (tryPreprocessing) totalPasses += 2; // Standard + enhanced preprocessing
  if (tryRotations) totalPasses += 3; // 90, 180, 270 degrees

  let currentPass = 0;

  // Helper function to recognize with progress tracking
  const recognizeWithProgress = async (img, label) => {
    currentPass++;
    const passProgress = (currentPass - 1) / totalPasses;

    try {
      const result = await worker.recognize(img, {
        logger: (m) => {
          if (onProgress && m.progress !== undefined) {
            const overallProgress = passProgress + (m.progress / totalPasses);
            onProgress({
              status: `${label} (${currentPass}/${totalPasses})`,
              progress: overallProgress,
            });
          }
        },
      });

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
        method: label,
      };
    } catch (error) {
      console.warn(`OCR pass failed (${label}):`, error);
      return null;
    }
  };

  // Pass 1: Original image
  const originalResult = await recognizeWithProgress(imgElement, 'Original');
  if (originalResult) results.push(originalResult);

  if (tryPreprocessing) {
    // Pass 2: Standard preprocessing
    const preprocessed = preprocessImage(imgElement, {
      sharpen: true,
      adaptiveThreshold: true,
      contrastLevel: 1.5,
      denoise: true,
    });
    const preprocessedResult = await recognizeWithProgress(preprocessed, 'Preprocessed');
    if (preprocessedResult) results.push(preprocessedResult);

    // Pass 3: Enhanced preprocessing with deskewing
    const deskewed = deskewImage(preprocessed);
    const deskewedResult = await recognizeWithProgress(deskewed, 'Deskewed');
    if (deskewedResult) results.push(deskewedResult);
  }

  if (tryRotations) {
    // Use preprocessed image if available, otherwise original
    const baseImage = results.length > 1 ?
      preprocessImage(imgElement, { sharpen: true, adaptiveThreshold: true }) :
      imgElement;

    // Pass 4-6: Try different rotations for book spines
    for (const degrees of [90, 180, 270]) {
      const rotated = rotateImage(baseImage, degrees);
      const rotatedResult = await recognizeWithProgress(rotated, `Rotated ${degrees}°`);
      if (rotatedResult) results.push(rotatedResult);
    }
  }

  // Select best result based on confidence and text length
  if (results.length === 0) {
    throw new Error('All OCR passes failed');
  }

  // Score results based on confidence and meaningful text length
  const scoredResults = results.map(r => ({
    ...r,
    score: (r.confidence || 0) * Math.min(1, (r.text?.trim().length || 0) / 10),
  }));

  // Sort by score descending
  scoredResults.sort((a, b) => b.score - a.score);

  const bestResult = scoredResults[0];

  // Log results for debugging
  console.log('OCR multi-pass results:', scoredResults.map(r => ({
    method: r.method,
    confidence: r.confidence?.toFixed(2),
    textLength: r.text?.length,
    score: r.score?.toFixed(2),
  })));

  return bestResult;
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
  recognizeTextMultiPass,
  preprocessImage,
  detectVerticalText,
  rotateImage,
  deskewImage,
  terminateWorker,
  getWorkerStatus,
};
