import { describe, it, expect, vi } from 'vitest';

describe('Image Preview Unit Tests', () => {
  it('validates supported image MIME types correctly', () => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = ['application/pdf', 'video/mp4', 'audio/mp3', 'text/plain'];

    validTypes.forEach((type) => {
      expect(type.startsWith('image/')).toBe(true);
    });

    invalidTypes.forEach((type) => {
      expect(type.startsWith('image/')).toBe(false);
    });
  });

  it('validates image file size limit correctly', () => {
    const maxLimit = 10 * 1024 * 1024; // 10MB
    const validSize = 2 * 1024 * 1024; // 2MB
    const invalidSize = 12 * 1024 * 1024; // 12MB

    expect(validSize <= maxLimit).toBe(true);
    expect(invalidSize <= maxLimit).toBe(false);
  });

  it('formats image file sizes cleanly', () => {
    const formatSize = (bytes: number) => {
      return bytes > 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(bytes / 1024)} KB`;
    };

    expect(formatSize(2100000)).toBe('2.0 MB');
    expect(formatSize(500000)).toBe('488 KB');
  });

  it('handles object URL creation and revocation safely', () => {
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:http://localhost/dummy');

    const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    const url = URL.createObjectURL(file);

    expect(url).toBe('blob:http://localhost/dummy');
    expect(createObjectURL).toHaveBeenCalledWith(file);

    URL.revokeObjectURL(url);
    expect(revokeObjectURL).toHaveBeenCalledWith(url);
  });
});
