"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Componente que exibe o saldo de créditos do usuário
 * Mostra um ícone de moeda e o valor atual
 * Loading state com skeleton enquanto busca dados
 */
export function CreditBalance() {
  const result = useQuery(api.credits.queries.get);

  // Enquanto carrega, mostra skeleton
  const isLoading = result === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-primary">
        <div className="w-4 h-4 bg-bg-tertiary rounded-full animate-pulse" />
        <div className="w-8 h-4 bg-bg-tertiary rounded animate-pulse" />
      </div>
    );
  }

  const balance = result?.balance ?? 0;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-primary"
      title={`Você tem ${balance} créditos`}
    >
      {/* Ícone de moeda/crédito */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12" />
        <path d="M8 10h8" />
        <path d="M8 14h8" />
      </svg>

      <span className="text-sm font-medium text-fg-primary">{balance}</span>
    </div>
  );
}
