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

    console.log('[GPhotos Annotator] Mounting overlay for photo', { 
      photoId, 
      imgElement: img,
      imgParent: img.parentElement?.tagName
    });

    this.overlay = document.createElement('div');
    this.overlay.id = 'gphotos-annotator-overlay';
    document.body.appendChild(this.overlay);

    // Wait for image to have valid dimensions before positioning
    await this.waitForImageDimensions(img);
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

  private async waitForImageDimensions(img: HTMLImageElement): Promise<void> {
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        console.log('[GPhotos Annotator] Image dimensions ready', { width: rect.width, height: rect.height });
        return;
      }
      console.log('[GPhotos Annotator] Waiting for image dimensions, attempt', i + 1);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    console.warn('[GPhotos Annotator] Image dimensions still invalid after waiting');
  }

  private positionOverlay(): void {
    if (!this.overlay || !this.currentImg) return;
    const rect = this.currentImg.getBoundingClientRect();
    console.log('[GPhotos Annotator] Positioning overlay', {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      overlayId: this.overlay.id,
      dotsCount: this.overlay.querySelectorAll('.annotator-dot').length
    });
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
    console.log('[GPhotos Annotator] Attaching double-click listener to image', {
      tagName: this.currentImg.tagName,
      src: this.currentImg.src?.substring(0, 100),
      style: {
        pointerEvents: window.getComputedStyle(this.currentImg).pointerEvents,
        position: window.getComputedStyle(this.currentImg).position,
        zIndex: window.getComputedStyle(this.currentImg).zIndex
      }
    });
    
    // Global double-click listener to detect any dblclick on the page
    const globalDblClickListener = (e: MouseEvent) => {
      console.log('[GPhotos Annotator] Global double-click detected on', {
        target: e.target,
        currentTarget: e.currentTarget,
        tagName: (e.target as HTMLElement)?.tagName,
        className: (e.target as HTMLElement)?.className,
        isCurrentImg: e.target === this.currentImg
      });
      
      // If it's an image element and we're mounted, handle it
      if ((e.target as HTMLElement)?.tagName === 'IMG' && this.currentPhotoId) {
        const img = e.target as HTMLImageElement;
        if (img.src.includes('googleusercontent.com')) {
          console.log('[GPhotos Annotator] Handling double-click from global listener');
          
          // Update currentImg to the one that actually receives events
          if (this.currentImg !== img) {
            console.log('[GPhotos Annotator] Switching to event-receiving image', {
              oldClassName: this.currentImg?.className,
              newClassName: img.className
            });
            
            // Remove listeners from old image
            if (this.currentImg) {
              this.currentImg.removeEventListener('dblclick', this.handleDoubleClick);
            }
            
            // Update to new image and reposition overlay
            this.currentImg = img;
            this.resizeObserver?.disconnect();
            this.resizeObserver = new ResizeObserver(() => this.positionOverlay());
            this.resizeObserver.observe(img);
            this.positionOverlay();
          }
          
          const rect = img.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          console.log('[GPhotos Annotator] Coordinates from global listener', { x, y, photoId: this.currentPhotoId });
          this.onDoubleClick?.(x, y, this.currentPhotoId);
        }
      }
    };
    
    document.addEventListener('dblclick', globalDblClickListener, true);
    
    // Add test listeners to debug event propagation
    this.currentImg.addEventListener('click', (e) => {
      console.log('[GPhotos Annotator] Single click detected on image', e);
    }, true);
    
    this.currentImg.addEventListener('mousedown', (e) => {
      console.log('[GPhotos Annotator] Mouse down on image', { button: e.button, detail: e.detail });
    }, true);
    
    this.currentImg.addEventListener('mouseup', (e) => {
      console.log('[GPhotos Annotator] Mouse up on image', { button: e.button, detail: e.detail });
    }, true);
    
    this.currentImg.addEventListener('dblclick', this.handleDoubleClick, true);
    
    // Also try without capture phase
    this.currentImg.addEventListener('dblclick', (e) => {
      console.log('[GPhotos Annotator] Double-click (bubble phase)', e);
    }, false);
  }

  private handleDoubleClick = (e: MouseEvent): void => {
    console.log('[GPhotos Annotator] Double-click detected', { 
      clientX: e.clientX, 
      clientY: e.clientY,
      currentImg: !!this.currentImg,
      currentPhotoId: this.currentPhotoId
    });
    if (!this.currentImg || !this.currentPhotoId) {
      console.warn('[GPhotos Annotator] Cannot handle double-click: missing currentImg or photoId');
      return;
    }
    const rect = this.currentImg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    console.log('[GPhotos Annotator] Double-click coordinates (ratio)', { x, y, photoId: this.currentPhotoId });
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
