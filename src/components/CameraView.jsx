import { useEffect } from 'react';
import { X, SwitchCamera, Scan } from './Icons';

export default function CameraView({
  videoRef,
  canvasRef,
  onCapture,
  onClose,
  onSwitchCamera,
  isActive,
}) {
  // Prevent body scroll when camera is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanning frame */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[80%] max-w-[300px] aspect-[3/4]">
            {/* Frame border */}
            <div className="absolute inset-0 border-2 border-primary-500/30 rounded-lg" />

            {/* Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary-500 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary-500 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary-500 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary-500 rounded-br-lg" />

            {/* Scan line animation */}
            <div className="absolute inset-x-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-scan" />
          </div>
        </div>

        {/* Hint text */}
        <div className="absolute bottom-32 left-0 right-0 text-center">
          <p className="text-white/80 text-sm font-medium drop-shadow-lg">
            Position book cover or spine in frame
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 safe-bottom">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            aria-label="Close camera"
          >
            <X size={24} />
          </button>

          {/* Capture button */}
          <button
            onClick={onCapture}
            disabled={!isActive}
            className="w-[72px] h-[72px] rounded-full border-4 border-white p-1 disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-label="Capture photo"
          >
            <div className="w-full h-full rounded-full bg-white group-hover:bg-white/90 group-active:bg-white/80 transition-colors flex items-center justify-center">
              <Scan className="text-dark-900" size={28} />
            </div>
          </button>

          {/* Switch camera button */}
          <button
            onClick={onSwitchCamera}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            aria-label="Switch camera"
          >
            <SwitchCamera size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
