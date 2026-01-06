"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { type Theme, THEME_KEY, getResolvedTheme, applyTheme } from "@/lib/theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(THEME_KEY) as Theme) || "system";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    mediaQuery.removeEventListener("change", callback);
  };
}

export function useTheme() {
  const localTheme = useSyncExternalStore(subscribe, getStoredTheme, () => "system" as Theme);

  const preferences = useQuery(api.preferences.queries.get);
  const updateThemeMutation = useMutation(api.preferences.mutations.updateTheme);

  // Use Convex theme if available and different from local
  const theme: Theme =
    preferences && preferences.theme && preferences.theme !== localTheme
      ? (preferences.theme as Theme)
      : localTheme;

  // Apply theme on changes
  if (typeof window !== "undefined") {
    applyTheme(theme);
    if (preferences && preferences.theme && preferences.theme !== localTheme) {
      localStorage.setItem(THEME_KEY, preferences.theme as Theme);
    }
  }

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      applyTheme(newTheme);
      localStorage.setItem(THEME_KEY, newTheme);
      window.dispatchEvent(new Event("storage"));

      if (preferences !== null && preferences !== undefined) {
        try {
          await updateThemeMutation({ theme: newTheme });
        } catch {
          // Silently fail - localStorage is the fallback
        }
      }
    },
    [preferences, updateThemeMutation]
  );

  const resolvedTheme = getResolvedTheme(theme);

  return { theme, setTheme, resolvedTheme };
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => setTheme("light")}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          theme === "light"
            ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        Claro
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          theme === "dark"
            ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        Escuro
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          theme === "system"
            ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        Sistema
      </button>
    </div>
  );
}
