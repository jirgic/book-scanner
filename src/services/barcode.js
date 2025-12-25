/**
 * Barcode Scanner Service using html5-qrcode
 * Handles barcode scanning for ISBN and other codes
 */

import { Html5Qrcode } from 'html5-qrcode';

let scanner = null;
let isScanning = false;

/**
 * Initialize the barcode scanner
 * @param {string} elementId - ID of the HTML element to render the scanner
 * @param {object} options - Scanner configuration options
 * @returns {Promise<Html5Qrcode>}
 */
export async function initializeScanner(elementId, options = {}) {
  if (scanner) {
    return scanner;
  }

  scanner = new Html5Qrcode(elementId);
  return scanner;
}

/**
 * Start continuous barcode scanning
 * @param {string} cameraId - Camera device ID (optional)
 * @param {function} onScanSuccess - Callback for successful scans
 * @param {function} onScanError - Callback for scan errors
 * @param {object} config - Scanner configuration
 * @returns {Promise<void>}
 */
export async function startScanning(
  cameraId = null,
  onScanSuccess,
  onScanError = null,
  config = {}
) {
  if (!scanner) {
    throw new Error('Scanner not initialized');
  }

  if (isScanning) {
    console.warn('Scanner is already running');
    return;
  }

  const scanConfig = {
    fps: config.fps || 10,
    qrbox: config.qrbox || { width: 250, height: 100 },
    aspectRatio: config.aspectRatio || 1.777778,
    disableFlip: config.disableFlip || false,
    // Support multiple barcode formats
    formatsToSupport: config.formatsToSupport || [
      // Common book ISBN formats
      13, // EAN_13 - Standard ISBN-13 barcode
      2,  // EAN_8
      // Other common formats
      1,  // UPC_A
      0,  // QR_CODE
      128, // CODE_128
      39, // CODE_39
    ],
  };

  const cameraConfig = cameraId
    ? { deviceId: { exact: cameraId } }
    : { facingMode: 'environment' };

  try {
    await scanner.start(
      cameraConfig,
      scanConfig,
      (decodedText, decodedResult) => {
        if (onScanSuccess) {
          onScanSuccess(decodedText, decodedResult);
        }
      },
      (errorMessage) => {
        // Scan errors are common and expected, only call callback if provided
        if (onScanError) {
          onScanError(errorMessage);
        }
      }
    );

    isScanning = true;
  } catch (error) {
    console.error('Failed to start barcode scanning:', error);
    throw new Error(`Barcode scanning failed: ${error.message}`);
  }
}

/**
 * Stop barcode scanning
 * @returns {Promise<void>}
 */
export async function stopScanning() {
  if (!scanner || !isScanning) {
    return;
  }

  try {
    await scanner.stop();
    isScanning = false;
  } catch (error) {
    console.error('Failed to stop scanning:', error);
    isScanning = false;
  }
}

/**
 * Scan image file for barcodes
 * @param {File} imageFile - Image file to scan
 * @returns {Promise<string>} Decoded barcode text
 */
export async function scanImageFile(imageFile) {
  if (!scanner) {
    throw new Error('Scanner not initialized');
  }

  try {
    const result = await scanner.scanFile(imageFile, true);
    return result;
  } catch (error) {
    console.error('Failed to scan image file:', error);
    throw new Error(`Image scan failed: ${error.message}`);
  }
}

/**
 * Get available cameras
 * @returns {Promise<Array>} List of camera devices
 */
export async function getCameras() {
  try {
    const devices = await Html5Qrcode.getCameras();
    return devices;
  } catch (error) {
    console.error('Failed to get cameras:', error);
    return [];
  }
}

/**
 * Clear the scanner instance
 * @returns {Promise<void>}
 */
export async function clearScanner() {
  if (scanner) {
    if (isScanning) {
      await stopScanning();
    }
    await scanner.clear();
    scanner = null;
  }
  isScanning = false;
}

/**
 * Get scanner state
 * @returns {object} Scanner state information
 */
export function getScannerState() {
  return {
    initialized: !!scanner,
    scanning: isScanning,
  };
}

/**
 * Format ISBN from barcode
 * @param {string} barcode - Raw barcode text
 * @returns {string|null} Formatted ISBN or null if invalid
 */
export function formatISBN(barcode) {
  // Remove any non-numeric characters
  const cleaned = barcode.replace(/[^0-9]/g, '');

  // ISBN-13 (EAN-13)
  if (cleaned.length === 13) {
    return cleaned;
  }

  // ISBN-10
  if (cleaned.length === 10) {
    return cleaned;
  }

  return null;
}

/**
 * Validate if barcode is likely an ISBN
 * @param {string} barcode - Barcode text
 * @returns {boolean} True if likely an ISBN
 */
export function isISBN(barcode) {
  const isbn = formatISBN(barcode);
  if (!isbn) return false;

  // ISBN-13 starts with 978 or 979
  if (isbn.length === 13) {
    return isbn.startsWith('978') || isbn.startsWith('979');
  }

  // ISBN-10
  if (isbn.length === 10) {
    return true;
  }

  return false;
}

export default {
  initializeScanner,
  startScanning,
  stopScanning,
  scanImageFile,
  getCameras,
  clearScanner,
  getScannerState,
  formatISBN,
  isISBN,
};
