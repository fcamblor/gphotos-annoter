/**
 * Shows a modal asking the user to identify themselves from the list of interessés.
 * Returns the selected name.
 */
export function promptForIdentity(interesses: string[]): Promise<string> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'annotator-panel';
    modal.style.cssText = 'top: 50%; left: 50%; transform: translate(-50%, -50%);';

    modal.innerHTML = `
      <h2>Qui êtes-vous ?</h2>
      <p style="color: #aaa; font-size: 13px; margin: 0 0 12px;">
        Sélectionnez votre nom pour commencer à annoter les photos.
      </p>
      <ul class="annotator-identity-list">
        ${interesses.map((name) => `<li data-name="${escapeHtml(name)}">${escapeHtml(name)}</li>`).join('')}
      </ul>
    `;

    modal.querySelectorAll('li').forEach((li) => {
      li.addEventListener('click', () => {
        modal.remove();
        resolve(li.dataset.name!);
      });
    });

    document.body.appendChild(modal);
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
