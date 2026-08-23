export const formatMessageTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatConversationTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
};

export const formatDateDivider = (dateString?: string): string => {
  if (!dateString) return 'TODAY';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';

  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
};

export const formatLastSeen = (dateString?: string): string => {
  if (!dateString) return 'Offline';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return 'Last seen just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  if (diffHours < 48) return 'Last seen yesterday';
  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
};

