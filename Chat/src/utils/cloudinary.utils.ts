/**
 * Cloudinary URL transformation utilities for optimized avatar and image delivery.
 */

export type AvatarSizeVariant = 'sm' | 'md' | 'lg' | 'xl' | number;

const SIZE_MAP: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 64,   // 32px display @ 2x DPR
  md: 128,  // 48-64px display @ 2x DPR
  lg: 256,  // 96-128px display @ 2x DPR
  xl: 512,  // 256-512px profile modal display
};

/**
 * Returns an optimized Cloudinary delivery URL with face-aware cropping,
 * auto format, and auto quality matching the requested display size.
 */
export function getOptimizedCloudinaryUrl(
  url?: string | null,
  size: AvatarSizeVariant = 'md'
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }

  const cleanUrl = url.trim();

  // If not a Cloudinary URL, return as-is
  if (!cleanUrl.includes('cloudinary.com') || !cleanUrl.includes('/upload/')) {
    return cleanUrl;
  }

  // If already contains transformation params, return as-is
  if (/\/upload\/[a-z]_[^/]+\//i.test(cleanUrl)) {
    return cleanUrl;
  }

  const targetDim = typeof size === 'number' ? size : SIZE_MAP[size] || 128;
  const transformation = `w_${targetDim},h_${targetDim},c_fill,g_face,q_auto,f_auto`;

  return cleanUrl.replace('/upload/', `/upload/${transformation}/`);
}
