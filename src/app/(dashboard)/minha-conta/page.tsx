"use client";

import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { useQuery, usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { useState, useCallback, useEffect } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MinhaContaPage() {
  const { data: session } = useSession();
  const creditsResult = useQuery(api.credits.queries.get);
  const { results: transactions, status, loadMore } = usePaginatedQuery(
    api.credits.queries.getTransactions,
    {},
    { initialNumItems: 20 }
  );
  
  // Todos os temas disponíveis (para mostrar os defaults + desbloqueados)
  const allThemes = useQuery(api.themes.queries.list);
  const { theme: activeTheme } = useActiveTheme();
  const setActiveTheme = useMutation(api.themes.mutations.setActive);
  
  // Estado para ativação e toast
  const [activatingThemeId, setActivatingThemeId] = useState<Id<"themes"> | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Auto-dismiss toast após 3s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleActivateTheme = useCallback(async (themeId: Id<"themes">, themeName: string) => {
    setActivatingThemeId(themeId);
    try {
      await setActiveTheme({ themeId });
      setToast({ message: `Tema "${themeName}" ativado!`, type: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao ativar tema";
      setToast({ message, type: "error" });
    } finally {
      setActivatingThemeId(null);
    }
  }, [setActiveTheme]);

  if (!session) {
    return null;
  }

  const { user } = session;
  const balance = creditsResult?.balance ?? 0;
  
  // Filtra apenas temas desbloqueados (defaults + comprados) e ordena: ativo primeiro
  const availableThemes = allThemes?.filter(t => t.isUnlocked) ?? [];
  const sortedThemes = [...availableThemes].sort((a, b) => {
    const aIsActive = activeTheme?._id === a._id;
    const bIsActive = activeTheme?._id === b._id;
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;
    // Defaults primeiro, depois por nome
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-full p-8 bg-bg-secondary">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-fg-primary">Minha Conta</h1>
          <Link
            href="/dashboard"
            className="text-sm text-accent hover:text-accent-hover"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>

        <div className="p-6 bg-bg-primary border border-border-primary rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-fg-primary">Informações</h2>

          <div className="space-y-3">
            {user.name && (
              <div className="flex items-center gap-2">
                <span className="text-fg-secondary">Nome:</span>
                <span className="font-medium text-fg-primary">{user.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-fg-secondary">Email:</span>
              <span className="font-medium text-fg-primary">{user.email}</span>
            </div>

          </div>
        </div>

        {/* Seção Temas */}
        <div className="p-6 bg-bg-primary border border-border-primary rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-fg-primary">Temas</h2>
            <Link
              href="/temas"
              className="text-sm text-accent hover:text-accent-hover"
            >
              Ver Galeria →
            </Link>
          </div>

          {/* Loading State */}
          {allThemes === undefined && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-bg-tertiary animate-pulse rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Grid de Temas Disponíveis */}
          {sortedThemes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {sortedThemes.map((theme) => {
                const isActive = activeTheme?._id === theme._id;
                const isActivating = activatingThemeId === theme._id;

                return (
                  <button
                    key={theme._id}
                    onClick={() => !isActive && !isActivating && handleActivateTheme(theme._id, theme.name)}
                    disabled={isActive || isActivating}
                    className={`
                      relative p-3 rounded-lg border transition-all text-left
                      ${isActive
                        ? "border-accent ring-2 ring-accent/30 bg-bg-secondary cursor-default"
                        : "border-border-primary bg-bg-secondary hover:border-accent/50 cursor-pointer"
                      }
                      ${isActivating ? "opacity-70" : ""}
                    `}
                  >
                    {/* Preview de Cores */}
                    <div className="mb-3 h-16 rounded-md overflow-hidden grid grid-cols-3 gap-px">
                      <div
                        className="col-span-2 row-span-2"
                        style={{ backgroundColor: theme.colors.bgPrimary }}
                      >
                        <div className="p-1.5 flex flex-col gap-0.5">
                          <div
                            className="h-2 w-10 rounded"
                            style={{ backgroundColor: theme.colors.fgPrimary }}
                          />
                          <div
                            className="h-1.5 w-7 rounded opacity-60"
                            style={{ backgroundColor: theme.colors.fgSecondary }}
                          />
                        </div>
                      </div>
                      <div style={{ backgroundColor: theme.colors.bgSecondary }} />
                      <div style={{ backgroundColor: theme.colors.accent }} />
                    </div>

                    {/* Nome do Tema */}
                    <h3 className="font-medium text-sm text-fg-primary truncate">
                      {theme.name}
                    </h3>

                    {/* Badge Ativo */}
                    {isActive && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-fg">
                        Ativo
                      </span>
                    )}

                    {/* Loading Indicator */}
                    {isActivating && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full bg-bg-tertiary text-fg-secondary">
                        Ativando...
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Link para explorar mais temas */}
          {sortedThemes.length > 0 && (
            <p className="text-sm text-fg-secondary text-center pt-2">
              <Link href="/temas" className="text-accent hover:text-accent-hover">
                Explorar mais temas na galeria →
              </Link>
            </p>
          )}

          {/* Toast */}
          {toast && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all animate-in slide-in-from-bottom-2 ${
                toast.type === "success"
                  ? "bg-success-bg text-success"
                  : "bg-error-bg text-error"
              }`}
            >
              {toast.message}
            </div>
          )}
        </div>

        {/* Seção de Créditos */}
        <div className="p-6 bg-bg-primary border border-border-primary rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-fg-primary">Créditos</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-primary">
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
              <span className="text-lg font-bold text-fg-primary">
                {creditsResult === undefined ? "..." : balance}
              </span>
            </div>
          </div>

          <p className="text-sm text-fg-secondary">
            Ganhe créditos criando workspaces e blocos. Use para desbloquear temas premium.
          </p>

          {/* Histórico de Transações */}
          <div className="pt-4 border-t border-border-primary">
            <h3 className="text-sm font-semibold text-fg-secondary mb-3">Histórico de Transações</h3>

            {status === "LoadingFirstPage" && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-bg-tertiary animate-pulse rounded" />
                ))}
              </div>
            )}

            {transactions.length === 0 && status === "Exhausted" && (
              <p className="text-sm text-fg-muted py-4 text-center">
                Nenhuma transação ainda. Crie workspaces e blocos para ganhar créditos!
              </p>
            )}

            {transactions.length > 0 && (
              <>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between py-2 px-3 rounded hover:bg-bg-secondary"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-fg-primary truncate">{tx.reason}</p>
                        <p className="text-xs text-fg-muted">{formatDate(tx.createdAt)}</p>
                      </div>
                      <span
                        className={`text-sm font-semibold ml-3 ${
                          tx.amount > 0 ? "text-success" : "text-error"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
                {status === "CanLoadMore" && (
                  <button
                    onClick={() => loadMore(20)}
                    className="w-full mt-2 py-2 text-sm text-accent hover:text-accent-hover font-medium rounded-lg hover:bg-bg-secondary transition-colors"
                  >
                    Carregar mais
                  </button>
                )}
                {status === "LoadingMore" && (
                  <div className="w-full mt-2 py-2 text-sm text-fg-muted text-center">
                    Carregando...
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-error hover:bg-error/80 text-white rounded-lg transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
