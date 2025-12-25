import { useEffect, useRef, useState } from 'react';
import { X } from './Icons';

export default function BarcodeView({
  scannerId,
  onScanSuccess,
  onClose,
  isActive,
}) {
  const containerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent body scroll when barcode scanner is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setIsMounted(true);
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Scanner Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          {/* Scanner element - html5-qrcode will render here */}
          <div
            id={scannerId}
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden"
          />
        </div>
      </div>

      {/* Overlay with instructions */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hint text */}
        <div className="absolute top-20 left-0 right-0 text-center px-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 inline-block">
            <p className="text-white text-base font-medium mb-1">
              Scan Book Barcode
            </p>
            <p className="text-white/70 text-sm">
              Position ISBN barcode within the frame
            </p>
          </div>
        </div>

        {/* Supported formats hint */}
        <div className="absolute bottom-32 left-0 right-0 text-center px-4">
          <div className="bg-primary-500/10 backdrop-blur-sm rounded-lg p-3 inline-block">
            <p className="text-primary-300 text-xs">
              Supports ISBN-13, ISBN-10, EAN, UPC, and QR codes
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 safe-top">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            aria-label="Close barcode scanner"
          >
            <X size={24} />
          </button>

          <div className="flex-1" />

          {/* Status indicator */}
          {isActive && (
            <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-sm font-medium">
                Scanning
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Custom styles for html5-qrcode */}
      <style>{`
        #${scannerId} {
          border: none !important;
        }
        #${scannerId} > div {
          border: none !important;
        }
        #${scannerId} video {
          border-radius: 0.5rem !important;
          border: 2px solid rgba(99, 102, 241, 0.3) !important;
        }
        #${scannerId} button {
          background-color: rgba(99, 102, 241, 0.9) !important;
          color: white !important;
          border: none !important;
          padding: 0.5rem 1rem !important;
          border-radius: 0.5rem !important;
          font-size: 0.875rem !important;
          margin: 0.5rem !important;
          cursor: pointer !important;
        }
        #${scannerId} button:hover {
          background-color: rgba(99, 102, 241, 1) !important;
        }
        #${scannerId} select {
          background-color: rgba(17, 24, 39, 0.8) !important;
          color: white !important;
          border: 1px solid rgba(99, 102, 241, 0.3) !important;
          padding: 0.5rem !important;
          border-radius: 0.5rem !important;
          font-size: 0.875rem !important;
          margin: 0.5rem !important;
        }
        #${scannerId}__dashboard {
          display: none !important;
        }
        #${scannerId}__dashboard_section {
          background-color: transparent !important;
        }
        #${scannerId}__scan_region {
          border: none !important;
        }
      `}</style>
    </div>
  );
}
