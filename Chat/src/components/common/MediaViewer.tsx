import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface MediaViewerPayload {
  url: string;
  name?: string;
  type: 'image' | 'video';
}

export const MediaViewer: React.FC = () => {
  const { activeModal, modalPayload, closeModal } = useChat();
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (activeModal === 'media_viewer') {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [activeModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModal === 'media_viewer' && e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeModal]);

  if (activeModal !== 'media_viewer' || !modalPayload) return null;

  const { url, name, type } = modalPayload as MediaViewerPayload;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (type !== 'image') return;
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1 || type !== 'image') return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = async () => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name || (type === 'video' ? 'video.mp4' : 'image.jpg');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        {type === 'image' && (
          <div className="flex items-center gap-1 bg-gray-900/80 border border-white/10 p-1 rounded-full text-white text-xs mr-2 shadow-lg">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-1.5 hover:bg-gray-800 rounded-full transition-colors disabled:opacity-40"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold text-gray-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-1.5 hover:bg-gray-800 rounded-full transition-colors disabled:opacity-40"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {scale > 1 && (
              <button
                onClick={handleResetZoom}
                className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-amber-400"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleDownload}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full transition-colors"
          title="Download Image"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={closeModal}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full transition-colors"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image View Container */}
      <div
        className="max-w-[90vw] max-h-[90vh] flex flex-col items-center justify-center relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {type === 'video' ? (
          <video src={url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
        ) : (
          <img
            src={url}
            alt={name || 'Attachment'}
            style={{
              transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
            draggable={false}
          />
        )}
        {name && <p className="mt-3 text-sm text-gray-300 font-medium z-10 pointer-events-none">{name}</p>}
      </div>
    </div>
  );
};
