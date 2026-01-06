export type Theme = "light" | "dark" | "system";

export const THEME_KEY = "maiglia-theme";

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getResolvedTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const resolved = getResolvedTheme(theme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(THEME_KEY) as Theme) || "system";
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, theme);
}
