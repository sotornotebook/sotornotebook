import { DB_NAME, DB_VERSION, MIGRATIONS } from "./schema.js";

let dbPromise = null;

/**
 * Opens (and lazily creates/migrates) the SOTOR IndexedDB database.
 * Safe to call repeatedly — the connection is opened once and reused.
 */
export function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      // Apply every migration newer than what's already on disk, in
      // order, so a device jumping several versions at once still ends
      // up with the full current schema.
      for (const migration of MIGRATIONS) {
        if (migration.version > event.oldVersion) {
          migration.run(db, request.transaction);
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("SOTOR database upgrade blocked by another open tab."));
  });

  return dbPromise;
}
