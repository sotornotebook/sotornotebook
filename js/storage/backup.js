import { DB_VERSION, STORES } from "../database/schema.js";
import { getAll, put, clear } from "./indexeddb-store.js";
import { getAllRaw as getAllSettingsRaw, restoreAllRaw as restoreAllSettingsRaw } from "./settings.js";

const BACKUP_FORMAT_VERSION = 1;

/** Builds a single plain-object snapshot of everything stored locally. */
export async function createBackup() {
  const data = {};
  for (const storeName of Object.values(STORES)) {
    data[storeName] = await getAll(storeName);
  }
  return {
    format: "sotor-backup",
    formatVersion: BACKUP_FORMAT_VERSION,
    dbVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    settings: getAllSettingsRaw(),
    data,
  };
}

/** Triggers a browser download of the current backup as a JSON file. */
export async function downloadBackup(filename = `sotor-backup-${Date.now()}.json`) {
  const backup = await createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Replaces all local data with the contents of a previously exported backup object. */
export async function restoreBackup(backup) {
  if (!backup || backup.format !== "sotor-backup") {
    throw new Error("Not a recognized SOTOR backup file.");
  }
  for (const storeName of Object.values(STORES)) {
    const rows = backup.data?.[storeName];
    if (!Array.isArray(rows)) continue;
    await clear(storeName);
    for (const row of rows) {
      await put(storeName, row);
    }
  }
  if (backup.settings) {
    restoreAllSettingsRaw(backup.settings);
  }
}

/** Convenience wrapper for restoring from a File (e.g. an <input type="file"> selection). */
export async function restoreBackupFromFile(file) {
  const text = await file.text();
  return restoreBackup(JSON.parse(text));
}
