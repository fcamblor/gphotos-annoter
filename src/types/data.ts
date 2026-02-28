export interface GPhotoPlaceholder {
  /** Google Photos URL or photo ID */
  gphoto: string;
  /** X coordinate as fraction (0.0 - 1.0) relative to image width */
  x: number;
  /** Y coordinate as fraction (0.0 - 1.0) relative to image height */
  y: number;
}

export interface InterestedPerson {
  /** Name matching an entry in db-interessés */
  who: string;
  /** Whether this person is interested */
  interested: boolean;
  /** ISO 8601 timestamp of last update */
  lastUpdated: string;
}

export interface Item {
  id: string;
  name: string;
  placeholders: GPhotoPlaceholder[];
  color: string;
  interested_people: InterestedPerson[];
}

export interface ItemMessage {
  item_id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface AppState {
  currentUser: string | null;
  spreadsheetId: string;
}
