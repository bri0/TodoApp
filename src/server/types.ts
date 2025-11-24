export interface Task {
  id: string;
  done: boolean;
  pinned: boolean;
  name: string;
  description?: string;
  emoji?: string;
  color: string;
  date: Date | string;
  deadline?: Date | string;
  category?: Category[];
  lastSave?: Date | string;
  sharedBy?: string;
  position?: number;
  numericId?: number;
}

export interface Category {
  id: string;
  name: string;
  emoji?: string;
  color: string;
  lastSave?: Date | string;
  numericId?: number;
}

export interface SyncData {
  tasks: Task[];
  categories: Category[];
}

export interface RegisterRequest {
  uid: string;
  publicKeyHash: string;
  publicKey: string;
}

export interface SyncRequest {
  publicKeyHash: string;
  publicKey: string; // Added for auto-registration
  data: SyncData;
  merged?: boolean;
}

export interface SyncResponse {
  encryptedData: string;
  version: number;
  needsMerge: boolean;
}

export interface User {
  uid: string;
  public_key_hash: string;
  public_key: string;
  created_at: number;
}

export interface UserData {
  uid: string;
  encrypted_data: string | null;
  version: number;
  updated_at: number;
}
