"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import {
  applyPremiumTheme,
  THEME_CACHE_KEY,
  type PremiumTheme,
} from "@/lib/premiumTheme";

interface ThemeContextValue {
  /** O tema premium ativo ou null se usando padrão */
  activeTheme: PremiumTheme | null;
  /** true enquanto carrega o tema do servidor */
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  activeTheme: null,
  isLoading: true,
});

/**
 * Hook para acessar o contexto de tema premium
 */
export function usePremiumTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider que gerencia a aplicação dinâmica de temas
 *
 * O hydration script inline (em layout.tsx) já aplica o tema correto do
 * localStorage antes do React montar, evitando FOUC.
 *
 * Problema resolvido aqui: o primeiro resultado da query Convex chega ANTES
 * do JWT propagar, então getActive retorna default-light (fallback pré-auth).
 * Se aplicássemos cegamente, causaria um flash branco. A solução é comparar
 * o primeiro resultado do servidor com o cache do localStorage — se divergem,
 * é fallback pré-auth e ignoramos. Resultados subsequentes (pós-auth) aplicam normalmente.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, isLoading } = useActiveTheme();
  const hasReceivedFirstTheme = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    // Primeiro resultado do Convex: pode ser fallback pré-auth (default-light)
    // porque a query roda antes do JWT propagar. O hydration script já aplicou
    // o tema correto do localStorage, então só aplicamos se o servidor confirmar.
    if (!hasReceivedFirstTheme.current) {
      hasReceivedFirstTheme.current = true;
      try {
        const cachedSlug = localStorage.getItem(THEME_CACHE_KEY);
        if (cachedSlug && theme?.slug !== cachedSlug) {
          // Servidor discorda do cache → provável fallback pré-auth → ignora
          return;
        }
      } catch {}
    }

    applyPremiumTheme(theme);
  }, [theme, isLoading]);

  const value: ThemeContextValue = {
    activeTheme: theme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
