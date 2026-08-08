// LocalStorage helper for settings, theme, last screen, and small
// preferences only — never journal content (that belongs in IndexedDB).
const PREFIX = "sotor:";

function readEntry(fullKey, fallback) {
  try {
    const raw = localStorage.getItem(fullKey);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeEntry(fullKey, value) {
  localStorage.setItem(fullKey, JSON.stringify(value));
}

export function getSetting(key, fallback = null) {
  return readEntry(`${PREFIX}settings:${key}`, fallback);
}

export function setSetting(key, value) {
  writeEntry(`${PREFIX}settings:${key}`, value);
}

export function getTheme() {
  return readEntry(`${PREFIX}theme`, "paper");
}

export function setTheme(theme) {
  writeEntry(`${PREFIX}theme`, theme);
}

export function getLastScreen() {
  return readEntry(`${PREFIX}last-screen`, "dashboard");
}

export function setLastScreen(screen) {
  writeEntry(`${PREFIX}last-screen`, screen);
}

/** Every SOTOR-namespaced LocalStorage entry, keyed without the prefix. Used by backup/restore. */
export function getAllRaw() {
  const entries = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const fullKey = localStorage.key(i);
    if (fullKey && fullKey.startsWith(PREFIX)) {
      entries[fullKey.slice(PREFIX.length)] = readEntry(fullKey, null);
    }
  }
  return entries;
}

/** Restores entries produced by getAllRaw(). Used by backup/restore. */
export function restoreAllRaw(entries) {
  for (const [key, value] of Object.entries(entries)) {
    writeEntry(PREFIX + key, value);
  }
}
