import React from 'react';
import { X, Download } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface MediaViewerPayload {
  url: string;
  name?: string;
  type: 'image' | 'video';
}

export const MediaViewer: React.FC = () => {
  const { activeModal, modalPayload, closeModal } = useChat();

  if (activeModal !== 'media_viewer' || !modalPayload) return null;

  const { url, name, type } = modalPayload as MediaViewerPayload;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          download={name || 'media'}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full transition-colors"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={closeModal}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center">
        {type === 'video' ? (
          <video src={url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
        ) : (
          <img
            src={url}
            alt={name || 'Attachment'}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        )}
        {name && <p className="mt-3 text-sm text-gray-300 font-medium">{name}</p>}
      </div>
    </div>
  );
};
