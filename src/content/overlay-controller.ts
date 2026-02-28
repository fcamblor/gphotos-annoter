import type { Item } from '../types/data';
import type { Repository } from '../api/repository';
import { renderDots } from './dot-renderer';

export class OverlayController {
  private overlay: HTMLDivElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private scrollListener: (() => void) | null = null;
  private currentImg: HTMLImageElement | null = null;
  private currentPhotoId: string | null = null;
  private allItems: Item[] = [];

  // These callbacks are set externally (by index.ts) to wire up panels
  onDotClick: ((item: Item, event: MouseEvent) => void) | null = null;
  onDotHover: ((item: Item, event: MouseEvent) => void) | null = null;
  onDotLeave: (() => void) | null = null;
  onDoubleClick: ((x: number, y: number, photoId: string) => void) | null = null;

  constructor(
    private repo: Repository,
    private currentUser: string,
  ) {}

  async mount(photoId: string, img: HTMLImageElement): Promise<void> {
    this.unmount();
    this.currentPhotoId = photoId;
    this.currentImg = img;

    this.overlay = document.createElement('div');
    this.overlay.id = 'gphotos-annotator-overlay';
    document.body.appendChild(this.overlay);

    this.positionOverlay();

    this.resizeObserver = new ResizeObserver(() => this.positionOverlay());
    this.resizeObserver.observe(img);

    // Reposition on scroll
    const onScroll = () => this.positionOverlay();
    this.scrollListener = onScroll;
    window.addEventListener('scroll', onScroll, true);

    this.attachDoubleClickListener();
    await this.loadAndRenderDots();
  }

  private positionOverlay(): void {
    if (!this.overlay || !this.currentImg) return;
    const rect = this.currentImg.getBoundingClientRect();
    Object.assign(this.overlay.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      pointerEvents: 'none',
      zIndex: '999999',
    });
  }

  private async loadAndRenderDots(): Promise<void> {
    if (!this.overlay || !this.currentPhotoId) return;
    this.allItems = await this.repo.getAllItems();

    renderDots(
      this.overlay,
      this.allItems,
      this.currentPhotoId,
      (item, e) => this.onDotHover?.(item, e),
      () => this.onDotLeave?.(),
      (item, e) => this.onDotClick?.(item, e),
    );
  }

  private attachDoubleClickListener(): void {
    if (!this.currentImg) return;
    this.currentImg.addEventListener('dblclick', this.handleDoubleClick);
  }

  private handleDoubleClick = (e: MouseEvent): void => {
    if (!this.currentImg || !this.currentPhotoId) return;
    const rect = this.currentImg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    this.onDoubleClick?.(x, y, this.currentPhotoId);
  };

  async refresh(): Promise<void> {
    this.repo['itemsCache'] = null; // force re-fetch
    await this.loadAndRenderDots();
  }

  getCurrentPhotoId(): string | null {
    return this.currentPhotoId;
  }

  getAllItems(): Item[] {
    return this.allItems;
  }

  unmount(): void {
    if (this.currentImg) {
      this.currentImg.removeEventListener('dblclick', this.handleDoubleClick);
    }
    this.overlay?.remove();
    this.overlay = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      this.scrollListener = null;
    }
    this.currentImg = null;
    this.currentPhotoId = null;
  }
}
