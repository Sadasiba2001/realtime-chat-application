import React from 'react';
import type { UserPresence } from '../../types/chat.types';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: UserPresence;
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  showStatus = false,
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
  };

  const statusDotSizes = {
    sm: 'w-2.5 h-2.5 bottom-0 right-0 border',
    md: 'w-3 h-3 bottom-0 right-0 border-2',
    lg: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
    xl: 'w-5 h-5 bottom-1 right-1 border-2',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
    away: 'bg-amber-500',
    busy: 'bg-rose-500',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative inline-block flex-shrink-0 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-xs border border-gray-200 dark:border-gray-700/50`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center shadow-xs`}
        >
          {initials}
        </div>
      )}

      {showStatus && status && (
        <span
          className={`absolute rounded-full ${statusDotSizes[size]} ${statusColors[status]} border-white dark:border-[#111b21]`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
