import type { Item, GPhotoPlaceholder, InterestedPerson, ItemMessage } from '../types/data';
import { readSheet, appendRows, updateRange, getSheetProperties, deleteRow, type SheetProperties } from './sheets';

const SHEET_INTERESSES = 'db-interessés';
const SHEET_ITEMS = 'db-item';
const SHEET_MESSAGES = 'db-item-message';

export class Repository {
  private sheetProps: SheetProperties[] | null = null;
  private itemsCache: Item[] | null = null;

  constructor(
    private spreadsheetId: string,
    private token: string,
  ) {}

  updateToken(token: string): void {
    this.token = token;
  }

  private async getSheetId(title: string): Promise<number> {
    if (!this.sheetProps) {
      this.sheetProps = await getSheetProperties(this.spreadsheetId, this.token);
    }
    const sheet = this.sheetProps.find((s) => s.title === title);
    if (!sheet) throw new Error(`Sheet "${title}" not found`);
    return sheet.sheetId;
  }

  async getInteresses(): Promise<string[]> {
    const rows = await readSheet(this.spreadsheetId, `${SHEET_INTERESSES}!A:A`, this.token);
    // Skip header row
    return rows.slice(1).map((row) => row[0]).filter(Boolean);
  }

  async getAllItems(): Promise<Item[]> {
    if (this.itemsCache) return this.itemsCache;
    const rows = await readSheet(this.spreadsheetId, `${SHEET_ITEMS}!A:E`, this.token);
    // Skip header: id, name, placeholders, color, interested_people
    const items = rows.slice(1).map((row) => this.rowToItem(row));
    this.itemsCache = items;
    return items;
  }

  private invalidateCache(): void {
    this.itemsCache = null;
  }

  private rowToItem(row: string[]): Item {
    return {
      id: row[0] ?? '',
      name: row[1] ?? '',
      placeholders: safeJsonParse<GPhotoPlaceholder[]>(row[2], []),
      color: row[3] ?? '#E53935',
      interested_people: safeJsonParse<InterestedPerson[]>(row[4], []),
    };
  }

  private itemToRow(item: Item): unknown[] {
    return [
      item.id,
      item.name,
      JSON.stringify(item.placeholders),
      item.color,
      JSON.stringify(item.interested_people),
    ];
  }

  async getItemById(id: string): Promise<Item | null> {
    const items = await this.getAllItems();
    return items.find((i) => i.id === id) ?? null;
  }

  async createItem(name: string, placeholder: GPhotoPlaceholder, color: string): Promise<Item> {
    const item: Item = {
      id: crypto.randomUUID(),
      name,
      placeholders: [placeholder],
      color,
      interested_people: [],
    };
    await appendRows(
      this.spreadsheetId,
      `${SHEET_ITEMS}!A:E`,
      [this.itemToRow(item)],
      this.token,
    );
    this.invalidateCache();
    return item;
  }

  async updateItem(item: Item): Promise<void> {
    const rowIndex = await this.findItemRowIndex(item.id);
    if (rowIndex === -1) throw new Error(`Item ${item.id} not found`);
    // rowIndex is 0-based data row, +2 for header and 1-based sheets addressing
    const range = `${SHEET_ITEMS}!A${rowIndex + 2}:E${rowIndex + 2}`;
    await updateRange(this.spreadsheetId, range, [this.itemToRow(item)], this.token);
    this.invalidateCache();
  }

  async deleteItem(itemId: string): Promise<void> {
    const rowIndex = await this.findItemRowIndex(itemId);
    if (rowIndex === -1) throw new Error(`Item ${itemId} not found`);
    const sheetId = await this.getSheetId(SHEET_ITEMS);
    // rowIndex is 0-based data row, +1 for header = actual sheet row index (0-based)
    await deleteRow(this.spreadsheetId, sheetId, rowIndex + 1, this.token);
    this.invalidateCache();
  }

  private async findItemRowIndex(itemId: string): Promise<number> {
    const rows = await readSheet(this.spreadsheetId, `${SHEET_ITEMS}!A:A`, this.token);
    // Skip header, find the data row index (0-based)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === itemId) return i - 1;
    }
    return -1;
  }

  async getMessagesForItem(itemId: string): Promise<ItemMessage[]> {
    const rows = await readSheet(this.spreadsheetId, `${SHEET_MESSAGES}!A:D`, this.token);
    return rows
      .slice(1)
      .filter((row) => row[0] === itemId)
      .map((row) => ({
        item_id: row[0],
        author: row[1] ?? '',
        timestamp: row[2] ?? '',
        content: row[3] ?? '',
      }));
  }

  async postMessage(itemId: string, author: string, content: string): Promise<ItemMessage> {
    const msg: ItemMessage = {
      item_id: itemId,
      author,
      timestamp: new Date().toISOString(),
      content,
    };
    await appendRows(
      this.spreadsheetId,
      `${SHEET_MESSAGES}!A:D`,
      [[msg.item_id, msg.author, msg.timestamp, msg.content]],
      this.token,
    );
    return msg;
  }
}

function safeJsonParse<T>(str: string | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
