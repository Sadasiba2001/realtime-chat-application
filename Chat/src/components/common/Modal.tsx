import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f2937]/30 dark:bg-black/60 animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-surface dark:bg-g-bg2 rounded-xl shadow-menu overflow-hidden border border-line dark:border-g-line z-10 dark:shadow-g`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-g-line bg-surface-2 dark:bg-g-s2">
            <h3 className="text-lg font-semibold text-ink dark:text-g-text">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-ink-2 hover:text-ink dark:text-g-text2 dark:hover:text-g-text rounded-full hover:bg-surface-2 dark:hover:bg-g-s3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[85vh]">{children}</div>
      </div>
    </div>
  );
};
