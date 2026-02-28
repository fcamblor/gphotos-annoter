import { findMainPhotoImage, extractPhotoIdFromUrl } from './image-finder';

export type PhotoChangeCallback = (photoId: string, img: HTMLImageElement) => void;

/**
 * Observes navigation between photos in Google Photos SPA.
 * Uses dual detection: URL polling + MutationObserver.
 * Returns a cleanup function.
 */
export function startPhotoObserver(onChanged: PhotoChangeCallback): () => void {
  let lastPhotoId: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function check() {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      doCheck();
    }, 200);
  }

  function doCheck() {
    const photoId = extractPhotoIdFromUrl(location.href);
    if (!photoId) {
      if (lastPhotoId !== null) {
        lastPhotoId = null;
        // Left photo view — could notify controller to unmount
      }
      return;
    }
    if (photoId === lastPhotoId) return;

    const img = findMainPhotoImage();
    if (!img) return;

    lastPhotoId = photoId;
    onChanged(photoId, img);
  }

  // Poll URL changes (catches pushState navigation)
  const interval = setInterval(check, 300);

  // Observe DOM mutations (catches image element changes)
  const observer = new MutationObserver(check);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  });

  return () => {
    clearInterval(interval);
    if (debounceTimer) clearTimeout(debounceTimer);
    observer.disconnect();
  };
}
