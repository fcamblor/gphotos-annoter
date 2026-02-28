import Fuse from 'fuse.js';
import type { Item } from '../types/data';

let fuse: Fuse<Item> | null = null;

export function initFuzzySearch(items: Item[]): void {
  fuse = new Fuse(items, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true,
  });
}

export function searchItems(query: string): Item[] {
  if (!fuse || !query.trim()) return [];
  return fuse.search(query).map((r) => r.item);
}
