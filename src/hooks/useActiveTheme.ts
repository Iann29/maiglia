"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { PremiumTheme } from "@/lib/premiumTheme";

/**
 * Hook que busca o tema premium ativo do usuário
 *
 * Retorna:
 * - theme: O tema ativo ou null se usando padrão
 * - isLoading: true enquanto busca do Convex
 * - error: Erro se houver falha na busca
 */
export function useActiveTheme() {
  const result = useQuery(api.themes.queries.getActive);

  // O Convex retorna undefined enquanto carrega
  const isLoading = result === undefined;

  // Converte para o tipo PremiumTheme (adiciona _id como string)
  const theme: PremiumTheme | null = result
    ? {
        ...result,
        _id: result._id as string,
      }
    : null;

  return {
    theme,
    isLoading,
  };
}
