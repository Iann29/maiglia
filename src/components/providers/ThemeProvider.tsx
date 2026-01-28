"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import {
  applyPremiumTheme,
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
 * Sistema unificado: cada tema define todas as cores (não existe light/dark separado)
 * - Busca o tema ativo do usuário via Convex
 * - Aplica cores e fonte do tema nas CSS variables
 * - Fallback para Default Light se tema não encontrado
 * - Transição suave ao trocar tema (via CSS)
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, isLoading } = useActiveTheme();

  // Aplica o tema quando muda
  useEffect(() => {
    // Se carregando, manter tema atual (evita flash)
    if (isLoading) return;

    // Aplica o tema (ou fallback para Default Light se null)
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
