/**
 * Finds the main photo image element in the Google Photos DOM.
 * Strategy: select the largest <img> with a googleusercontent.com src.
 */
export function findMainPhotoImage(): HTMLImageElement | null {
  const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
  const candidates = imgs.filter(
    (img) => img.src.includes('googleusercontent.com') && img.naturalWidth > 200,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, img) =>
    img.naturalWidth * img.naturalHeight > best.naturalWidth * best.naturalHeight ? img : best,
  );
}

/**
 * Extracts the photo ID from a Google Photos URL.
 * Handles patterns like /photo/AF... and /album/.../photo/AF...
 */
export function extractPhotoIdFromUrl(url: string): string | null {
  const match = url.match(/\/photo\/([^/?#]+)/);
  return match?.[1] ?? null;
}
