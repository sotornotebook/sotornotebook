// Application entry point. Feature modules are wired in here once the
// design system and router exist (see ROADMAP.md).
import { openDatabase } from "./storage/index.js";
import { initTheme } from "./theme.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}

// The inline script in index.html already set data-theme before paint;
// this re-applies it through the validated path so an invalid/legacy
// stored value falls back to DEFAULT_THEME instead of sticking around.
initTheme();

openDatabase()
  .then(() => console.info("[SOTOR] Local database ready."))
  .catch((error) => console.error("[SOTOR] Failed to open local database.", error));
