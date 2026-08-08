import { getTheme, setTheme as persistTheme } from "./storage/index.js";

export const THEMES = Object.freeze(["paper", "light", "dark"]);
// Keep this in sync with index.html's inline pre-paint script.
export const DEFAULT_THEME = "paper";

// <meta name="theme-color"> can't read CSS custom properties, so its
// value has to be kept in step with css/themes.css's --color-bg by hand.
const META_THEME_COLORS = {
  paper: "#f5efe6",
  light: "#ffffff",
  dark: "#1b1a18",
};

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", META_THEME_COLORS[theme]);
}

/** Applies the persisted theme (or DEFAULT_THEME if unset/invalid) and returns it. Call once on boot. */
export function initTheme() {
  const stored = getTheme();
  const theme = THEMES.includes(stored) ? stored : DEFAULT_THEME;
  apply(theme);
  return theme;
}

/** Switches the active theme, persists it, and notifies listeners (e.g. a future Themes settings screen). */
export function setTheme(theme) {
  if (!THEMES.includes(theme)) {
    throw new Error(`Unknown theme: ${theme}`);
  }
  apply(theme);
  persistTheme(theme);
  document.dispatchEvent(new CustomEvent("sotor:themechange", { detail: { theme } }));
}
