import { describe, it, expect } from 'vitest';
import { formatMessageTime, formatConversationTime, formatDateDivider, formatLastSeen } from '@/utils/date.utils';

describe('date.utils unit tests', () => {
  it('should format message time cleanly', () => {
    const timeStr = formatMessageTime('2026-08-27T10:30:00Z');
    expect(typeof timeStr).toBe('string');
    expect(timeStr.length).toBeGreaterThan(0);
  });

  it('should return fallback for invalid date in formatMessageTime', () => {
    const formatted = formatMessageTime('invalid-date-string');
    expect(formatted).toBe('invalid-date-string');
  });

  it('should format date divider', () => {
    const divider = formatDateDivider(new Date().toISOString());
    expect(divider).toBe('TODAY');
  });

  it('should format conversation timestamp correctly', () => {
    const convTime = formatConversationTime(new Date().toISOString());
    expect(typeof convTime).toBe('string');
  });

  it('should format last seen string', () => {
    const lastSeen = formatLastSeen(new Date().toISOString());
    expect(lastSeen).toBe('Last seen just now');
  });
});
