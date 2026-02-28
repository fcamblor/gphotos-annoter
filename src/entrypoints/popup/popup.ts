document.addEventListener('DOMContentLoaded', async () => {
  const spreadsheetInput = document.getElementById('spreadsheet-id') as HTMLInputElement;
  const currentUserSpan = document.getElementById('current-user')!;
  const saveBtn = document.getElementById('save-btn')!;
  const resetBtn = document.getElementById('reset-user')!;
  const statusDiv = document.getElementById('status')!;

  // Load current settings
  const result = await chrome.storage.local.get(['spreadsheetId', 'currentUser']);
  spreadsheetInput.value = (result.spreadsheetId as string) ?? '';
  currentUserSpan.textContent = (result.currentUser as string) ?? 'non défini';

  saveBtn.addEventListener('click', async () => {
    const newId = spreadsheetInput.value.trim();
    if (!newId) {
      statusDiv.textContent = 'Veuillez entrer un ID valide.';
      return;
    }
    await chrome.storage.local.set({ spreadsheetId: newId });
    statusDiv.textContent = 'Enregistré !';
    setTimeout(() => { statusDiv.textContent = ''; }, 2000);
  });

  resetBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove('currentUser');
    currentUserSpan.textContent = 'non défini';
    statusDiv.textContent = 'Utilisateur réinitialisé. Rechargez la page GPhotos.';
  });
});
