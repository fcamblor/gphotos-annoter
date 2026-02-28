import { getAuthToken } from './auth';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/** Callback invoked when the token is refreshed after a 401 */
let onTokenRefreshed: ((newToken: string) => void) | null = null;

export function setTokenRefreshCallback(cb: (newToken: string) => void): void {
  onTokenRefreshed = cb;
}

async function fetchWithRetry(url: string, init: RequestInit, token: string): Promise<Response> {
  let res = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    const newToken = await getAuthToken();
    onTokenRefreshed?.(newToken);
    res = await fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${newToken}` },
    });
  }

  return res;
}

export async function readSheet(
  spreadsheetId: string,
  range: string,
  token: string,
): Promise<string[][]> {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetchWithRetry(url, {}, token);
  if (!res.ok) throw new Error(`Sheets read error: ${res.status}`);
  const json = await res.json();
  return json.values ?? [];
}

export async function appendRows(
  spreadsheetId: string,
  range: string,
  values: unknown[][],
  token: string,
): Promise<void> {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  }, token);
  if (!res.ok) throw new Error(`Sheets append error: ${res.status}`);
}

export async function updateRange(
  spreadsheetId: string,
  range: string,
  values: unknown[][],
  token: string,
): Promise<void> {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const res = await fetchWithRetry(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  }, token);
  if (!res.ok) throw new Error(`Sheets update error: ${res.status}`);
}

export interface SheetProperties {
  sheetId: number;
  title: string;
}

export async function getSheetProperties(
  spreadsheetId: string,
  token: string,
): Promise<SheetProperties[]> {
  const url = `${BASE}/${spreadsheetId}?fields=sheets.properties`;
  const res = await fetchWithRetry(url, {}, token);
  if (!res.ok) throw new Error(`Sheets properties error: ${res.status}`);
  const json = await res.json();
  return json.sheets.map((s: { properties: SheetProperties }) => s.properties);
}

export async function deleteRow(
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number,
  token: string,
): Promise<void> {
  const url = `${BASE}/${spreadsheetId}:batchUpdate`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    }),
  }, token);
  if (!res.ok) throw new Error(`Sheets deleteRow error: ${res.status}`);
}
