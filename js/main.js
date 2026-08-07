// Application entry point. Feature modules are wired in here once the
// storage layer, theme engine, design system, and router exist
// (see ROADMAP.md for the build order).

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}
