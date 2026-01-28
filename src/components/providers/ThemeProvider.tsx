"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import {
  applyPremiumTheme,
  clearPremiumTheme,
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
 * Provider que gerencia a aplicação dinâmica de temas premium
 *
 * - Busca o tema ativo do usuário via Convex
 * - Aplica cores e fonte do tema nas CSS variables
 * - Fallback para Default Light se erro ou carregando
 * - Transição suave ao trocar tema (via CSS)
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, isLoading } = useActiveTheme();

  // Aplica o tema quando muda
  useEffect(() => {
    // Se carregando, manter tema atual (evita flash)
    if (isLoading) return;

    // Se não tem tema ou é tema default, limpa customizações
    if (!theme || theme.isDefault) {
      clearPremiumTheme();
      return;
    }

    // Aplica o tema premium
    applyPremiumTheme(theme);
  }, [theme, isLoading]);

  // Fallback: aplica cores default se tema é null após carregar
  useEffect(() => {
    if (!isLoading && !theme) {
      // Não aplica nada - deixa o CSS padrão funcionar
      clearPremiumTheme();
    }
  }, [theme, isLoading]);

  const value: ThemeContextValue = {
    activeTheme: theme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
