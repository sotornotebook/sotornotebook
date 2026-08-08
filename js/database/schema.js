// IndexedDB schema for the SOTOR local database.
//
// To change the schema: add a new entry to MIGRATIONS with the next
// version number and a `run` step. Never edit a migration that has
// already shipped — a device that already applied it won't re-run it.

export const DB_NAME = "sotor-db";
export const DB_VERSION = 1;

export const STORES = Object.freeze({
  JOURNAL_ENTRIES: "journalEntries",
  MOOD_LOGS: "moodLogs",
  REFLECTIONS: "reflections",
  TIME_CAPSULES: "timeCapsules",
  PHOTOS: "photos",
  VOICE_NOTES: "voiceNotes",
  METADATA: "metadata",
});

function createStore(db, name, keyPath, indexes = []) {
  const store = db.createObjectStore(name, { keyPath });
  for (const index of indexes) {
    store.createIndex(index.name, index.keyPath, index.options);
  }
  return store;
}

export const MIGRATIONS = [
  {
    version: 1,
    run(db) {
      createStore(db, STORES.JOURNAL_ENTRIES, "id", [
        { name: "createdAt", keyPath: "createdAt" },
        { name: "updatedAt", keyPath: "updatedAt" },
      ]);
      createStore(db, STORES.MOOD_LOGS, "id", [{ name: "date", keyPath: "date" }]);
      createStore(db, STORES.REFLECTIONS, "id", [{ name: "createdAt", keyPath: "createdAt" }]);
      createStore(db, STORES.TIME_CAPSULES, "id", [{ name: "unlockAt", keyPath: "unlockAt" }]);
      createStore(db, STORES.PHOTOS, "id", [
        { name: "journalEntryId", keyPath: "journalEntryId" },
        { name: "createdAt", keyPath: "createdAt" },
      ]);
      createStore(db, STORES.VOICE_NOTES, "id", [
        { name: "journalEntryId", keyPath: "journalEntryId" },
        { name: "createdAt", keyPath: "createdAt" },
      ]);
      // Key/value store for app-level metadata (e.g. schema notes,
      // last-opened timestamps) — singular by exception, it isn't a
      // collection of typed records.
      createStore(db, STORES.METADATA, "key");
    },
  },
];
