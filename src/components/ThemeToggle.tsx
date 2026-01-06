"use client";

import { useEffect, useSyncExternalStore, useCallback } from "react";
import {
  type Theme,
  THEME_KEY,
  getSystemTheme,
  applyTheme,
} from "@/lib/theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(THEME_KEY) as Theme) || "system";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getStoredTheme,
    () => "system" as Theme
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const current = localStorage.getItem(THEME_KEY) as Theme | null;
      if (!current || current === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    window.dispatchEvent(new Event("storage"));
  }, []);

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

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
