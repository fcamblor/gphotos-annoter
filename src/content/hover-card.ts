import type { Item } from '../types/data';

const CARD_ID = 'annotator-hover-card';

export function showHoverCard(item: Item, messageCount: number, event: MouseEvent): void {
  hideHoverCard();

  const card = document.createElement('div');
  card.id = CARD_ID;
  card.className = 'annotator-hover-card';

  const interested = item.interested_people.filter((p) => p.interested).map((p) => p.who);
  const notInterested = item.interested_people.filter((p) => !p.interested).map((p) => p.who);

  let html = `<strong>${escapeHtml(item.name)}</strong>`;
  if (interested.length) {
    html += `<span class="annotator-hover-interested">Intéressé(e)s : ${interested.map(escapeHtml).join(', ')}</span><br>`;
  }
  if (notInterested.length) {
    html += `<span class="annotator-hover-not-interested">Pas intéressé(e)s : ${notInterested.map(escapeHtml).join(', ')}</span><br>`;
  }
  html += `<span>${messageCount} message${messageCount !== 1 ? 's' : ''}</span>`;

  card.innerHTML = html;

  // Position near cursor, flip if near screen edge
  const x = Math.min(event.clientX + 12, window.innerWidth - 260);
  const y = Math.min(event.clientY + 12, window.innerHeight - 120);
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;

  document.body.appendChild(card);
}

export function hideHoverCard(): void {
  document.getElementById(CARD_ID)?.remove();
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
