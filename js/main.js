// Application entry point. Feature modules are wired in here once the
// theme engine, design system, and router exist (see ROADMAP.md).
import { openDatabase } from "./storage/index.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}

openDatabase()
  .then(() => console.info("[SOTOR] Local database ready."))
  .catch((error) => console.error("[SOTOR] Failed to open local database.", error));
