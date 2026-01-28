export type Theme = "light" | "dark";

export const THEME_KEY = "maiglia-theme";

export function getResolvedTheme(theme: Theme): "light" | "dark" {
  return theme;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const resolved = getResolvedTheme(theme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  // Migra valores antigos "system" para "light"
  if (stored !== "light" && stored !== "dark") {
    return "light";
  }
  return stored;
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, theme);
}
