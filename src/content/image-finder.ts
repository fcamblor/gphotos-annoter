/**
 * Finds the main photo image element in the Google Photos DOM.
 * Strategy: select the topmost <img> with a googleusercontent.com src that can receive pointer events.
 */
export function findMainPhotoImage(): HTMLImageElement | null {
  const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
  const candidates = imgs.filter(
    (img) => img.src.includes('googleusercontent.com') && img.naturalWidth > 200,
  );
  
  console.log('[GPhotos Annotator] Image candidates found:', candidates.map(img => ({
    tagName: img.tagName,
    className: img.className,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    zIndex: window.getComputedStyle(img).zIndex,
    pointerEvents: window.getComputedStyle(img).pointerEvents,
    position: window.getComputedStyle(img).position
  })));
  
  if (candidates.length === 0) return null;
  
  // Sort to find the best candidate:
  // 1. Prefer position: absolute over static (absolute images are overlays that receive events)
  // 2. Then by z-index (highest first)
  // 3. Then by size (largest first)
  const sorted = candidates.sort((a, b) => {
    const aStyle = window.getComputedStyle(a);
    const bStyle = window.getComputedStyle(b);
    
    // Prefer absolute positioning
    const aIsAbsolute = aStyle.position === 'absolute' || aStyle.position === 'fixed';
    const bIsAbsolute = bStyle.position === 'absolute' || bStyle.position === 'fixed';
    if (aIsAbsolute !== bIsAbsolute) return aIsAbsolute ? -1 : 1;
    
    // Then by z-index
    const aZ = aStyle.zIndex === 'auto' ? 0 : parseInt(aStyle.zIndex, 10);
    const bZ = bStyle.zIndex === 'auto' ? 0 : parseInt(bStyle.zIndex, 10);
    if (aZ !== bZ) return bZ - aZ; // Higher z-index first
    
    // Finally by size
    const aSize = a.naturalWidth * a.naturalHeight;
    const bSize = b.naturalWidth * b.naturalHeight;
    return bSize - aSize;
  });
  
  console.log('[GPhotos Annotator] Selected image:', {
    className: sorted[0].className,
    zIndex: window.getComputedStyle(sorted[0]).zIndex
  });
  
  return sorted[0];
}

/**
 * Extracts the photo ID from a Google Photos URL.
 * Handles patterns like /photo/AF... and /album/.../photo/AF...
 */
export function extractPhotoIdFromUrl(url: string): string | null {
  const match = url.match(/\/photo\/([^/?#]+)/);
  return match?.[1] ?? null;
}
