import type { Item } from '../types/data';

export type DotClickCallback = (item: Item, event: MouseEvent) => void;
export type DotHoverCallback = (item: Item, event: MouseEvent) => void;
export type DotLeaveCallback = () => void;

export function renderDots(
  overlay: HTMLDivElement,
  items: Item[],
  currentPhotoId: string,
  onHover: DotHoverCallback,
  onLeave: DotLeaveCallback,
  onClick: DotClickCallback,
): void {
  // Clear existing dots
  overlay.querySelectorAll('.annotator-dot').forEach((el) => el.remove());

  console.log('[GPhotos Annotator] Rendering dots', {
    totalItems: items.length,
    currentPhotoId,
    itemsWithPlaceholders: items.filter(i => i.placeholders.length > 0).length
  });

  let dotsRendered = 0;
  for (const item of items) {
    const placeholder = item.placeholders.find((p) => p.gphoto === currentPhotoId);
    if (!placeholder) continue;

    console.log('[GPhotos Annotator] Rendering dot for item', {
      itemName: item.name,
      x: placeholder.x,
      y: placeholder.y,
      color: item.color
    });

    const dot = document.createElement('div');
    dot.className = 'annotator-dot';
    dot.style.left = `${placeholder.x * 100}%`;
    dot.style.top = `${placeholder.y * 100}%`;
    dot.style.backgroundColor = item.color;
    dot.dataset.itemId = item.id;

    dot.addEventListener('mouseenter', (e) => onHover(item, e));
    dot.addEventListener('mouseleave', () => onLeave());
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(item, e);
    });

    overlay.appendChild(dot);
    
    // Log dot details after appending
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(dot);
      console.log('[GPhotos Annotator] Dot appended', {
        itemName: item.name,
        left: dot.style.left,
        top: dot.style.top,
        backgroundColor: dot.style.backgroundColor,
        computedDisplay: computedStyle.display,
        computedPosition: computedStyle.position,
        computedWidth: computedStyle.width,
        computedHeight: computedStyle.height,
        computedZIndex: computedStyle.zIndex,
        offsetParent: dot.offsetParent?.tagName,
        boundingRect: dot.getBoundingClientRect()
      });
    }, 100);
    
    dotsRendered++;
  }

  console.log('[GPhotos Annotator] Dots rendered:', dotsRendered);
}
