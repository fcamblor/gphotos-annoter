import type { Item, ItemMessage, InterestedPerson } from '../types/data';
import type { Repository } from '../api/repository';
import { showConfirmDialog } from './confirm-dialog';

const PANEL_ID = 'annotator-item-panel';

interface ItemPanelOptions {
  item: Item;
  currentPhotoId: string;
  currentUser: string;
  interesses: string[];
  repo: Repository;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export async function showItemPanel(opts: ItemPanelOptions): Promise<void> {
  hideItemPanel();

  const { item, currentPhotoId, currentUser, interesses, repo, onClose, onRefresh } = opts;
  const messages = await repo.getMessagesForItem(item.id);

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'annotator-panel';
  panel.style.cssText = 'top: 50%; right: 20px; transform: translateY(-50%);';

  // Build the panel HTML
  panel.innerHTML = buildPanelHtml(item, messages, currentUser, currentPhotoId, interesses);

  // Close button
  panel.querySelector('.annotator-panel-close')!.addEventListener('click', () => {
    hideItemPanel();
    onClose();
  });

  // Interest buttons
  setupInterestButtons(panel, item, currentUser, repo, onRefresh);

  // Suggest someone
  setupSuggestButtons(panel, item, currentUser, interesses, repo, messages);

  // Post message
  setupMessageForm(panel, item, currentUser, repo, messages);

  // Delete actions
  setupDeleteActions(panel, item, currentPhotoId, repo, onRefresh, messages);

  document.body.appendChild(panel);
}

export function hideItemPanel(): void {
  document.getElementById(PANEL_ID)?.remove();
}

function buildPanelHtml(
  item: Item,
  messages: ItemMessage[],
  currentUser: string,
  currentPhotoId: string,
  interesses: string[],
): string {
  const colorSwatch = `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${item.color};vertical-align:middle;"></span>`;

  // Interest section
  const currentInterest = item.interested_people.find((p) => p.who === currentUser);
  const interestHtml = `
    <div class="annotator-interest-section">
      <strong style="font-size:13px;">Votre positionnement :</strong>
      <div class="annotator-interest-row" style="margin-top:6px;">
        <button class="annotator-btn-interest" data-interest="true"
          ${currentInterest?.interested === true ? 'class="active-interested"' : ''}>
          Intéressé(e)
        </button>
        <button class="annotator-btn-not-interest" data-interest="false"
          ${currentInterest?.interested === false ? 'class="active-not-interested"' : ''}>
          Pas intéressé(e)
        </button>
      </div>
      ${buildOthersInterestHtml(item, currentUser)}
    </div>
  `;

  // Suggest section
  const otherInteresses = interesses.filter((name) => name !== currentUser);
  const suggestHtml = otherInteresses.length > 0 ? `
    <div style="margin-top:8px;">
      <strong style="font-size:13px;">Suggérer à :</strong>
      <div id="annotator-suggest-list" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
        ${otherInteresses.map((name) => `<button class="annotator-btn annotator-btn-secondary annotator-suggest-btn" data-name="${escapeHtml(name)}" style="font-size:11px;padding:2px 6px;">${escapeHtml(name)} ?</button>`).join('')}
      </div>
    </div>
  ` : '';

  // Messages section
  const messagesHtml = `
    <div class="annotator-messages">
      <strong style="font-size:13px;">${messages.length} message${messages.length !== 1 ? 's' : ''}</strong>
      <div id="annotator-messages-list">
        ${messages.map((m) => `
          <div class="annotator-message">
            <div class="annotator-message-meta">${escapeHtml(m.author)} · ${formatTime(m.timestamp)}</div>
            <div class="annotator-message-content">${escapeHtml(m.content)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Message input
  const inputHtml = `
    <div class="annotator-input-row">
      <textarea id="annotator-msg-input" placeholder="Écrire un message..." rows="1"></textarea>
      <button class="annotator-btn" id="annotator-msg-send">Envoyer</button>
    </div>
  `;

  // Delete actions
  const canDeleteItem = item.placeholders.length === 1 && messages.length === 0;
  const canDeletePlaceholder = item.placeholders.length > 1;

  const actionsHtml = (canDeleteItem || canDeletePlaceholder) ? `
    <div class="annotator-actions">
      ${canDeleteItem ? `<button class="annotator-btn annotator-btn-danger" id="annotator-delete-item">Supprimer l'objet</button>` : ''}
      ${canDeletePlaceholder ? `<button class="annotator-btn annotator-btn-danger" id="annotator-delete-placeholder">Supprimer ce point</button>` : ''}
    </div>
  ` : '';

  return `
    <button class="annotator-panel-close">&times;</button>
    <h2>${colorSwatch} ${escapeHtml(item.name)}</h2>
    ${interestHtml}
    ${suggestHtml}
    ${messagesHtml}
    ${inputHtml}
    ${actionsHtml}
  `;
}

function buildOthersInterestHtml(item: Item, currentUser: string): string {
  const others = item.interested_people.filter((p) => p.who !== currentUser);
  if (others.length === 0) return '';

  return `
    <div style="margin-top:8px;font-size:12px;color:#aaa;">
      ${others.map((p) => `<span class="${p.interested ? 'annotator-hover-interested' : 'annotator-hover-not-interested'}">${escapeHtml(p.who)}: ${p.interested ? 'intéressé(e)' : 'pas intéressé(e)'}</span>`).join('<br>')}
    </div>
  `;
}

function setupInterestButtons(
  panel: HTMLElement,
  item: Item,
  currentUser: string,
  repo: Repository,
  onRefresh: () => Promise<void>,
): void {
  const interestedBtn = panel.querySelector('.annotator-btn-interest') as HTMLButtonElement;
  const notInterestedBtn = panel.querySelector('.annotator-btn-not-interest') as HTMLButtonElement;

  // Set initial active state
  const current = item.interested_people.find((p) => p.who === currentUser);
  if (current?.interested === true) interestedBtn.classList.add('active-interested');
  if (current?.interested === false) notInterestedBtn.classList.add('active-not-interested');

  async function setInterest(interested: boolean) {
    const existing = item.interested_people.find((p) => p.who === currentUser);
    const now = new Date().toISOString();
    if (existing) {
      existing.interested = interested;
      existing.lastUpdated = now;
    } else {
      item.interested_people.push({ who: currentUser, interested, lastUpdated: now });
    }
    await repo.updateItem(item);

    const statusText = interested ? 'intéressé(e)' : 'pas intéressé(e)';
    await repo.postMessage(item.id, currentUser, `${currentUser} s'est positionné(e) comme ${statusText}`);

    // Update button states
    interestedBtn.classList.toggle('active-interested', interested);
    notInterestedBtn.classList.toggle('active-not-interested', !interested);

    await onRefresh();
  }

  interestedBtn.addEventListener('click', () => setInterest(true));
  notInterestedBtn.addEventListener('click', () => setInterest(false));
}

function setupSuggestButtons(
  panel: HTMLElement,
  item: Item,
  currentUser: string,
  _interesses: string[],
  repo: Repository,
  messages: ItemMessage[],
): void {
  panel.querySelectorAll('.annotator-suggest-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const name = (btn as HTMLElement).dataset.name!;
      const msg = await repo.postMessage(item.id, currentUser, `${name} ?`);
      messages.push(msg);
      appendMessageToList(panel, msg);
    });
  });
}

function setupMessageForm(
  panel: HTMLElement,
  item: Item,
  currentUser: string,
  repo: Repository,
  messages: ItemMessage[],
): void {
  const input = panel.querySelector('#annotator-msg-input') as HTMLTextAreaElement;
  const sendBtn = panel.querySelector('#annotator-msg-send')!;

  async function send() {
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    const msg = await repo.postMessage(item.id, currentUser, content);
    messages.push(msg);
    appendMessageToList(panel, msg);
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
}

function setupDeleteActions(
  panel: HTMLElement,
  item: Item,
  currentPhotoId: string,
  repo: Repository,
  onRefresh: () => Promise<void>,
  messages: ItemMessage[],
): void {
  const deleteItemBtn = panel.querySelector('#annotator-delete-item');
  const deletePlaceholderBtn = panel.querySelector('#annotator-delete-placeholder');

  deleteItemBtn?.addEventListener('click', async () => {
    // Re-check conditions
    if (item.placeholders.length !== 1 || messages.length > 0) return;
    const confirmed = await showConfirmDialog(`Supprimer l'objet "${item.name}" ?`);
    if (!confirmed) return;
    await repo.deleteItem(item.id);
    hideItemPanel();
    await onRefresh();
  });

  deletePlaceholderBtn?.addEventListener('click', async () => {
    if (item.placeholders.length <= 1) return;
    const confirmed = await showConfirmDialog(`Supprimer ce point de l'objet "${item.name}" ?`);
    if (!confirmed) return;
    item.placeholders = item.placeholders.filter((p) => p.gphoto !== currentPhotoId);
    await repo.updateItem(item);
    hideItemPanel();
    await onRefresh();
  });
}

function appendMessageToList(panel: HTMLElement, msg: ItemMessage): void {
  const list = panel.querySelector('#annotator-messages-list');
  if (!list) return;
  const div = document.createElement('div');
  div.className = 'annotator-message';
  div.innerHTML = `
    <div class="annotator-message-meta">${escapeHtml(msg.author)} · ${formatTime(msg.timestamp)}</div>
    <div class="annotator-message-content">${escapeHtml(msg.content)}</div>
  `;
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH}h`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
