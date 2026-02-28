export interface StoredSettings {
  spreadsheetId: string | null;
  currentUser: string | null;
}

export async function getSettings(): Promise<StoredSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['spreadsheetId', 'currentUser'], (result) => {
      resolve({
        spreadsheetId: (result.spreadsheetId as string) ?? null,
        currentUser: (result.currentUser as string) ?? null,
      });
    });
  });
}

export async function saveSettings(partial: Partial<StoredSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(partial, resolve);
  });
}
