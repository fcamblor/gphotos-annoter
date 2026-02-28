import type { Item } from '../types/data';

/** 20 distinct, contrasted colors for inventory items */
const PALETTE = [
  '#E53935', // red
  '#8E24AA', // purple
  '#D81B60', // pink
  '#5E35B1', // deep purple
  '#1E88E5', // blue
  '#3949AB', // indigo
  '#039BE5', // light blue
  '#C0CA33', // lime
  '#00ACC1', // cyan
  '#757575', // grey
  '#FDD835', // yellow
  '#00897B', // teal
  '#FFB300', // amber
  '#7CB342', // light green
  '#6D4C41', // brown
  '#FB8C00', // orange
  '#43A047', // green
  '#F4511E', // deep orange
  '#546E7A', // blue grey
  '#EC407A', // pink accent
];

/**
 * Returns the least-used color from the palette, given existing items.
 */
export function pickLeastUsedColor(existingItems: Item[]): string {
  const counts = new Map<string, number>();
  for (const color of PALETTE) {
    counts.set(color, 0);
  }
  for (const item of existingItems) {
    const current = counts.get(item.color);
    if (current !== undefined) {
      counts.set(item.color, current + 1);
    }
  }

  let minCount = Infinity;
  let bestColor = PALETTE[0];
  for (const [color, count] of counts) {
    if (count < minCount) {
      minCount = count;
      bestColor = color;
    }
  }
  return bestColor;
}

/**
 * Renders a color picker with the given pre-selected color.
 * Calls onSelect when the user picks a different color.
 */
export function renderColorPicker(
  selectedColor: string,
  onSelect: (color: string) => void,
): HTMLDivElement {
  const picker = document.createElement('div');
  picker.className = 'annotator-color-picker';

  for (const color of PALETTE) {
    const swatch = document.createElement('div');
    swatch.className = 'annotator-swatch';
    if (color === selectedColor) swatch.classList.add('selected');
    swatch.style.backgroundColor = color;

    swatch.addEventListener('click', () => {
      picker.querySelectorAll('.annotator-swatch').forEach((s) => s.classList.remove('selected'));
      swatch.classList.add('selected');
      onSelect(color);
    });

    picker.appendChild(swatch);
  }
  return picker;
}
