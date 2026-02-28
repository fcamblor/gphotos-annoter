export function showConfirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'annotator-confirm-overlay';

    overlay.innerHTML = `
      <div class="annotator-confirm-dialog">
        <p>${escapeHtml(message)}</p>
        <div class="annotator-confirm-buttons">
          <button class="annotator-btn annotator-btn-secondary" data-action="cancel">Annuler</button>
          <button class="annotator-btn annotator-btn-danger" data-action="confirm">Confirmer</button>
        </div>
      </div>
    `;

    overlay.querySelector('[data-action="cancel"]')!.addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });
    overlay.querySelector('[data-action="confirm"]')!.addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });

    document.body.appendChild(overlay);
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
