// Public storage API. Feature modules import only from here — never
// reach into js/database/ or call indexedDB/localStorage directly.
export { openDatabase } from "../database/db.js";
export { STORES } from "../database/schema.js";
export { put, get, getAll, getAllByIndex, remove, clear } from "./indexeddb-store.js";
export { getSetting, setSetting, getTheme, setTheme, getLastScreen, setLastScreen } from "./settings.js";
export { createBackup, downloadBackup, restoreBackup, restoreBackupFromFile } from "./backup.js";
