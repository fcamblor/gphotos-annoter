/**
 * Shows a modal asking the user to enter their Google Sheets spreadsheet ID.
 * Returns the entered ID.
 */
export function promptForSpreadsheetId(): Promise<string> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'annotator-panel';
    modal.style.cssText = 'top: 50%; left: 50%; transform: translate(-50%, -50%); min-width: 400px;';

    modal.innerHTML = `
      <h2>Configuration initiale</h2>
      <p style="color: #aaa; font-size: 13px; margin: 0 0 12px;">
        Veuillez entrer l'ID de votre Google Sheets pour commencer.
      </p>
      <p style="color: #aaa; font-size: 12px; margin: 0 0 8px;">
        L'ID se trouve dans l'URL de votre spreadsheet :<br/>
        <code style="font-size: 11px; background: #2a2a2a; padding: 2px 4px; border-radius: 3px;">
          https://docs.google.com/spreadsheets/d/<strong>VOTRE_ID_ICI</strong>/edit
        </code>
      </p>
      <details style="margin-bottom: 12px;">
        <summary style="color: #888; font-size: 11px; cursor: pointer; margin-bottom: 8px;">
          ℹ️ Structure requise de la spreadsheet
        </summary>
        <div style="background: #2a2a2a; padding: 8px; border-radius: 4px; font-size: 11px; color: #ccc;">
          Votre spreadsheet doit contenir 3 onglets :<br/>
          • <strong>db-interessés</strong> : colonne "name"<br/>
          • <strong>db-item</strong> : colonnes id, name, placeholders, color, interested_people<br/>
          • <strong>db-item-message</strong> : colonnes item_id, author, timestamp, content
        </div>
      </details>
      <input
        type="text"
        id="spreadsheet-id-input"
        placeholder="Ex: 10HzP9LO3jCL7EjGQGqXwxI8veyGwlqU1pEfECBFIBW4"
        style="width: 100%; padding: 8px; margin-bottom: 12px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-family: monospace; font-size: 12px;"
      />
      <button
        id="spreadsheet-id-submit"
        style="padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;"
        disabled
      >
        Valider
      </button>
      <p id="error-message" style="color: #f44336; font-size: 12px; margin-top: 8px; display: none;"></p>
    `;

    const input = modal.querySelector<HTMLInputElement>('#spreadsheet-id-input')!;
    const submitBtn = modal.querySelector<HTMLButtonElement>('#spreadsheet-id-submit')!;
    const errorMsg = modal.querySelector<HTMLParagraphElement>('#error-message')!;

    // Enable button only when input has content
    input.addEventListener('input', () => {
      submitBtn.disabled = !input.value.trim();
    });

    // Auto-focus input
    setTimeout(() => input.focus(), 100);

    // Submit on Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        submitBtn.click();
      }
    });

    submitBtn.addEventListener('click', () => {
      const id = input.value.trim();
      if (!id) {
        errorMsg.textContent = 'Veuillez entrer un ID valide.';
        errorMsg.style.display = 'block';
        return;
      }

      // Basic validation: should be a non-empty string (Google Sheets IDs are alphanumeric)
      if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        errorMsg.textContent = 'L\'ID ne semble pas valide. Il ne doit contenir que des lettres, chiffres, tirets et underscores.';
        errorMsg.style.display = 'block';
        return;
      }

      modal.remove();
      resolve(id);
    });

    document.body.appendChild(modal);
  });
}
