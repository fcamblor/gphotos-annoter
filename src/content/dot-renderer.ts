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

  for (const item of items) {
    const placeholder = item.placeholders.find((p) => p.gphoto === currentPhotoId);
    if (!placeholder) continue;

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
  }
}
