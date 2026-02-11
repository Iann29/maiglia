"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { useSession } from "@/lib/auth-client";
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
 *
 * IMPORTANTE: Espera o auth resolver antes de aplicar o tema do servidor.
 * Sem isso, o Convex retorna default-light como fallback (pré-auth) e causa
 * um flash branco antes do tema real ser carregado.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, isLoading } = useActiveTheme();
  const { isPending: authPending } = useSession();

  // Aplica o tema quando muda
  useEffect(() => {
    // Espera auth + query resolverem antes de aplicar
    // O hydration script inline já aplicou o tema do cache (localStorage),
    // então é seguro esperar — não haverá flash.
    if (isLoading || authPending) return;

    // Aplica o tema (ou fallback para Default Light se null)
    applyPremiumTheme(theme);
  }, [theme, isLoading, authPending]);

  const value: ThemeContextValue = {
    activeTheme: theme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
