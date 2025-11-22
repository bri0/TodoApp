import { syncData } from "../services/syncApi";
import { decryptData } from "./crypto";
import { mergeTasks, mergeCategories, prepareTasks, prepareCategories } from "./syncMerge";
import type { SyncData } from "../services/syncApi";
import type { User } from "../types/user";

let isSyncing = false;
let syncTimeout: NodeJS.Timeout | null = null;
let lastSyncedData: string | null = null;

/**
 * Automatically sync user data with the server if credentials exist
 * Debounced to avoid too many requests
 */
export async function autoSync(
  user: User,
  setUser: (user: User | ((prev: User) => User)) => void,
): Promise<void> {
  // Check if sync credentials exist
  const syncUid = localStorage.getItem("sync_uid");
  const syncPublicKey = localStorage.getItem("sync_public_key");
  const syncPublicKeyHash = localStorage.getItem("sync_public_key_hash");
  const syncPrivateKey = localStorage.getItem("sync_private_key");

  if (!syncUid || !syncPublicKey || !syncPublicKeyHash || !syncPrivateKey) {
    return; // No credentials, skip sync
  }

  // Create a hash of current data to check if it changed
  const currentDataHash = JSON.stringify({
    tasks: user.tasks.map((t) => ({ id: t.id, lastSave: t.lastSave })),
    categories: user.categories.map((c) => ({ id: c.id, lastSave: c.lastSave })),
  });

  // Skip if data hasn't changed since last sync
  if (currentDataHash === lastSyncedData) {
    return;
  }

  // Prevent concurrent syncs
  if (isSyncing) {
    return;
  }

  // Clear existing timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Debounce: wait 2 seconds after last change before syncing
  syncTimeout = setTimeout(async () => {
    try {
      isSyncing = true;
      console.log("Auto-syncing...");

      // Prepare data for sync
      const preparedTasks = prepareTasks(user.tasks);
      const preparedCategories = prepareCategories(user.categories);

      const localData: SyncData = {
        tasks: preparedTasks,
        categories: preparedCategories,
      };

      // Phase 1 - Send data to server and get response
      const response = await syncData(syncUid, syncPublicKeyHash, syncPublicKey, localData, false);

      // Decrypt response
      const decryptedData = await decryptData(
        response.encryptedData,
        syncPublicKey,
        syncPrivateKey,
      );
      const serverData: SyncData = JSON.parse(decryptedData);

      // Check if merge is needed
      if (response.needsMerge) {
        // Merge local and server data
        const mergedTasks = mergeTasks(user.tasks, serverData.tasks, user.deletedTasks);
        const mergedCategories = mergeCategories(
          user.categories,
          serverData.categories,
          user.deletedCategories,
        );

        const mergedData: SyncData = {
          tasks: prepareTasks(mergedTasks),
          categories: prepareCategories(mergedCategories),
        };

        // Phase 2 - Send merged data back to server
        await syncData(syncUid, syncPublicKeyHash, syncPublicKey, mergedData, true);

        // Update lastSyncedData BEFORE updating state to prevent re-trigger
        lastSyncedData = JSON.stringify({
          tasks: mergedTasks.map((t) => ({ id: t.id, lastSave: t.lastSave })),
          categories: mergedCategories.map((c) => ({ id: c.id, lastSave: c.lastSave })),
        });

        // Update local state
        setUser((prevUser) => ({
          ...prevUser,
          tasks: mergedTasks,
          categories: mergedCategories,
          lastSyncedAt: new Date(),
        }));
      } else {
        // No merge needed, just update lastSyncedAt
        // Update lastSyncedData to current data
        lastSyncedData = currentDataHash;

        setUser((prevUser) => ({
          ...prevUser,
          lastSyncedAt: new Date(),
        }));
      }

      console.log("Auto-sync completed");
    } catch (error) {
      console.error("Auto-sync error:", error);
      // Silently fail - don't interrupt user workflow
    } finally {
      isSyncing = false;
    }
  }, 2000); // 2 second debounce
}
