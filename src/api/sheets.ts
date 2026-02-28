const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export async function readSheet(
  spreadsheetId: string,
  range: string,
  token: string,
): Promise<string[][]> {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`Sheets append error: ${res.status}`);
}

export async function updateRange(
  spreadsheetId: string,
  range: string,
  values: unknown[][],
  token: string,
): Promise<void> {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });
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
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
  });
  if (!res.ok) throw new Error(`Sheets deleteRow error: ${res.status}`);
}
