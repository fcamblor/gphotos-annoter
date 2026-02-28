import type { Item, GPhotoPlaceholder } from '../types/data';
import type { Repository } from '../api/repository';
import { initFuzzySearch, searchItems } from './fuzzy-search';
import { pickLeastUsedColor, renderColorPicker } from './color-picker';

const PANEL_ID = 'annotator-new-placeholder-panel';

interface NewPlaceholderOptions {
  x: number;
  y: number;
  photoId: string;
  existingItems: Item[];
  repo: Repository;
  onDone: () => Promise<void>;
}

export function showNewPlaceholderPanel(opts: NewPlaceholderOptions): void {
  hideNewPlaceholderPanel();

  const { x, y, photoId, existingItems, repo, onDone } = opts;

  initFuzzySearch(existingItems);
  let selectedColor = pickLeastUsedColor(existingItems);
  let selectedItem: Item | null = null;
  let mode: 'new' | 'existing' = 'new';

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'annotator-panel';
  panel.style.cssText = 'top: 50%; left: 50%; transform: translate(-50%, -50%);';

  panel.innerHTML = `
    <button class="annotator-panel-close">&times;</button>
    <h2>Nouveau point</h2>

    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <button class="annotator-btn annotator-tab" data-mode="new" style="flex:1;">Nouvel objet</button>
      <button class="annotator-btn annotator-btn-secondary annotator-tab" data-mode="existing" style="flex:1;">Objet existant</button>
    </div>

    <div id="annotator-mode-new">
      <label style="display:block;margin-bottom:4px;font-size:12px;color:#aaa;">Nom de l'objet :</label>
      <input type="text" id="annotator-new-name" style="width:100%;padding:6px 8px;background:#2a2a2a;border:1px solid #444;border-radius:6px;color:white;font-size:13px;box-sizing:border-box;" placeholder="Ex: Horloge comtoise">
      <label style="display:block;margin:8px 0 4px;font-size:12px;color:#aaa;">Couleur :</label>
      <div id="annotator-color-container"></div>
      <button class="annotator-btn" id="annotator-create-btn" style="margin-top:12px;width:100%;">Créer</button>
    </div>

    <div id="annotator-mode-existing" style="display:none;">
      <label style="display:block;margin-bottom:4px;font-size:12px;color:#aaa;">Rechercher un objet :</label>
      <input type="text" id="annotator-search-input" style="width:100%;padding:6px 8px;background:#2a2a2a;border:1px solid #444;border-radius:6px;color:white;font-size:13px;box-sizing:border-box;" placeholder="Tapez pour chercher...">
      <div class="annotator-search-results" id="annotator-search-results"></div>
      <button class="annotator-btn" id="annotator-attach-btn" style="margin-top:12px;width:100%;" disabled>Attacher à cet objet</button>
    </div>
  `;

  // Close button
  panel.querySelector('.annotator-panel-close')!.addEventListener('click', hideNewPlaceholderPanel);

  // Tab switching
  const tabs = panel.querySelectorAll('.annotator-tab');
  const modeNewDiv = panel.querySelector('#annotator-mode-new') as HTMLDivElement;
  const modeExistingDiv = panel.querySelector('#annotator-mode-existing') as HTMLDivElement;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      mode = (tab as HTMLElement).dataset.mode as 'new' | 'existing';
      tabs.forEach((t) => {
        t.classList.toggle('annotator-btn-secondary', (t as HTMLElement).dataset.mode !== mode);
      });
      modeNewDiv.style.display = mode === 'new' ? 'block' : 'none';
      modeExistingDiv.style.display = mode === 'existing' ? 'block' : 'none';
    });
  });

  // Color picker
  const colorContainer = panel.querySelector('#annotator-color-container')!;
  colorContainer.appendChild(renderColorPicker(selectedColor, (c) => { selectedColor = c; }));

  // Create new item
  const nameInput = panel.querySelector('#annotator-new-name') as HTMLInputElement;
  const createBtn = panel.querySelector('#annotator-create-btn')!;

  createBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) return;
    const placeholder: GPhotoPlaceholder = { gphoto: photoId, x, y };
    await repo.createItem(name, placeholder, selectedColor);
    hideNewPlaceholderPanel();
    await onDone();
  });

  // Search existing items
  const searchInput = panel.querySelector('#annotator-search-input') as HTMLInputElement;
  const searchResults = panel.querySelector('#annotator-search-results')!;
  const attachBtn = panel.querySelector('#annotator-attach-btn') as HTMLButtonElement;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  searchInput.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = searchInput.value.trim();
      const results = searchItems(query);
      renderSearchResults(results, searchResults, (item) => {
        selectedItem = item;
        attachBtn.disabled = false;
        attachBtn.textContent = `Attacher à "${item.name}"`;
      });
    }, 150);
  });

  attachBtn.addEventListener('click', async () => {
    if (!selectedItem) return;
    selectedItem.placeholders.push({ gphoto: photoId, x, y });
    await repo.updateItem(selectedItem);
    hideNewPlaceholderPanel();
    await onDone();
  });

  document.body.appendChild(panel);
  nameInput.focus();
}

export function hideNewPlaceholderPanel(): void {
  document.getElementById(PANEL_ID)?.remove();
}

function renderSearchResults(
  items: Item[],
  container: Element,
  onSelect: (item: Item) => void,
): void {
  container.innerHTML = items.length === 0
    ? '<div style="padding:8px;color:#666;font-size:12px;">Aucun résultat</div>'
    : '';

  for (const item of items) {
    const div = document.createElement('div');
    div.className = 'annotator-search-result';
    div.innerHTML = `
      <div class="annotator-search-result-dot" style="background:${item.color};"></div>
      <span>${escapeHtml(item.name)}</span>
    `;
    div.addEventListener('click', () => {
      container.querySelectorAll('.annotator-search-result').forEach((r) =>
        (r as HTMLElement).style.background = '',
      );
      div.style.background = '#333';
      onSelect(item);
    });
    container.appendChild(div);
  }
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
