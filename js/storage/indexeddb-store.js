import { openDatabase } from "../database/db.js";

async function runRequest(storeName, mode, executor) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = executor(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Insert or overwrite a record. `value` must include the store's keyPath field. */
export function put(storeName, value) {
  return runRequest(storeName, "readwrite", (store) => store.put(value));
}

/** Fetch a single record by key, or `undefined` if it doesn't exist. */
export function get(storeName, key) {
  return runRequest(storeName, "readonly", (store) => store.get(key));
}

/** Fetch every record in a store. */
export function getAll(storeName) {
  return runRequest(storeName, "readonly", (store) => store.getAll());
}

/** Fetch records via a named index, optionally filtered by an IDBKeyRange/value. */
export function getAllByIndex(storeName, indexName, query) {
  return runRequest(storeName, "readonly", (store) => store.index(indexName).getAll(query));
}

/** Delete a single record by key. */
export function remove(storeName, key) {
  return runRequest(storeName, "readwrite", (store) => store.delete(key));
}

/** Delete every record in a store. */
export function clear(storeName) {
  return runRequest(storeName, "readwrite", (store) => store.clear());
}
