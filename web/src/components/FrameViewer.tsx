import { useState } from 'react';
import { ZoomIn, ZoomOut, Download } from 'lucide-react';

interface FrameViewerProps {
  src: string;
  alt: string;
}

export default function FrameViewer({ src, alt }: FrameViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(false);

  const handleZoomIn = () => setZoom(z => Math.min(3, z + 0.5));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.5));
  const handleReset = () => setZoom(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt.replace(/\s+/g, '_') + '.jpg';
    link.click();
  };

  if (error) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Failed to load image</p>
          <p className="text-xs mt-1 font-mono">{src}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleReset}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs font-mono transition-colors"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs transition-colors"
          title="Download image"
        >
          <Download size={14} />
          <span>Download</span>
        </button>
      </div>

      {/* Image container */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <div 
          className="absolute inset-0 overflow-auto"
          style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
        >
          <img
            src={src}
            alt={alt}
            className="transition-transform duration-200"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              minWidth: '100%',
              minHeight: '100%',
              objectFit: 'contain'
            }}
            onError={() => setError(true)}
          />
        </div>
      </div>
    </div>
  );
}
