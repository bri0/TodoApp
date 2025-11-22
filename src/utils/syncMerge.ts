import type { Task, Category, UUID } from "../types/user";

/**
 * Merge local and remote tasks
 * Uses numericId as primary identifier, falls back to UUID
 * Newer lastSave timestamp wins in case of conflicts
 */
export function mergeTasks(localTasks: Task[], remoteTasks: Task[], deletedTasks: UUID[]): Task[] {
  const mergedMap = new Map<number | string, Task>();

  // First, add all local tasks to the map
  for (const task of localTasks) {
    const key = task.numericId !== undefined ? task.numericId : task.id;
    mergedMap.set(key, task);
  }

  // Then, merge remote tasks
  for (const remoteTask of remoteTasks) {
    const key = remoteTask.numericId !== undefined ? remoteTask.numericId : remoteTask.id;
    const localTask = mergedMap.get(key);

    if (!localTask) {
      // Remote task doesn't exist locally - add it if not deleted
      if (!deletedTasks.includes(remoteTask.id)) {
        mergedMap.set(key, remoteTask);
      }
    } else {
      // Task exists in both - keep the newer one based on lastSave
      const localSave = localTask.lastSave ? new Date(localTask.lastSave).getTime() : 0;
      const remoteSave = remoteTask.lastSave ? new Date(remoteTask.lastSave).getTime() : 0;

      if (remoteSave > localSave) {
        mergedMap.set(key, remoteTask);
      }
      // If local is newer or equal, keep local (already in map)
    }
  }

  // Filter out deleted tasks
  const result = Array.from(mergedMap.values()).filter((task) => !deletedTasks.includes(task.id));

  return result;
}

/**
 * Merge local and remote categories
 * Uses numericId as primary identifier, falls back to UUID
 * Newer lastSave timestamp wins in case of conflicts
 */
export function mergeCategories(
  localCategories: Category[],
  remoteCategories: Category[],
  deletedCategories: UUID[],
): Category[] {
  const mergedMap = new Map<number | string, Category>();

  // First, add all local categories to the map
  for (const category of localCategories) {
    const key = category.numericId !== undefined ? category.numericId : category.id;
    mergedMap.set(key, category);
  }

  // Then, merge remote categories
  for (const remoteCategory of remoteCategories) {
    const key =
      remoteCategory.numericId !== undefined ? remoteCategory.numericId : remoteCategory.id;
    const localCategory = mergedMap.get(key);

    if (!localCategory) {
      // Remote category doesn't exist locally - add it if not deleted
      if (!deletedCategories.includes(remoteCategory.id)) {
        mergedMap.set(key, remoteCategory);
      }
    } else {
      // Category exists in both - keep the newer one based on lastSave
      const localSave = localCategory.lastSave ? new Date(localCategory.lastSave).getTime() : 0;
      const remoteSave = remoteCategory.lastSave ? new Date(remoteCategory.lastSave).getTime() : 0;

      if (remoteSave > localSave) {
        mergedMap.set(key, remoteCategory);
      }
      // If local is newer or equal, keep local (already in map)
    }
  }

  // Filter out deleted categories
  const result = Array.from(mergedMap.values()).filter(
    (category) => !deletedCategories.includes(category.id),
  );

  return result;
}

/**
 * Prepare tasks for sync by ensuring they have numericId
 */
export function prepareTasks(tasks: Task[]): Task[] {
  return tasks.map((task) => {
    // Update lastSave to current time
    return {
      ...task,
      lastSave: new Date(),
    };
  });
}

/**
 * Prepare categories for sync by ensuring they have numericId
 */
export function prepareCategories(categories: Category[]): Category[] {
  return categories.map((category) => {
    // Update lastSave to current time
    return {
      ...category,
      lastSave: new Date(),
    };
  });
}
