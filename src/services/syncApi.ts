import type { Task, Category } from "../types/user";

// Use relative path for same-origin API requests (no CORS needed)
const REMOTE_URL = import.meta.env.VITE_REMOTE_URL || "/api";

export interface SyncData {
  tasks: Task[];
  categories: Category[];
}

export interface SyncResponse {
  encryptedData: string;
  version: number;
  needsMerge: boolean;
}

/**
 * Sync data with the server
 * On first sync, automatically registers the user
 * @param publicKey - User's public key (for server to encrypt data)
 * @param merged - Whether this is the merged data being sent back (phase 2)
 * @returns Server response with encrypted data and merge status
 */
export async function syncData(
  uid: string,
  publicKeyHash: string,
  publicKey: string,
  data: SyncData,
  merged: boolean = false,
): Promise<SyncResponse> {
  try {
    const response = await fetch(`${REMOTE_URL}/t/${encodeURIComponent(uid)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicKeyHash,
        publicKey, // Include public key for auto-registration
        data,
        merged, // Indicate if this is merged data (phase 2)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Generic error message to prevent user enumeration
      if (response.status === 403) {
        throw new Error("403: Invalid user ID or password combination");
      }

      throw new Error(`Sync failed: ${response.status} - ${errorText}`);
    }

    // Server returns JSON with encrypted data, version, and merge flag
    const result: SyncResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Error syncing data:", error);
    throw error;
  }
}
