"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

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

  if (!session) {
    return null;
  }

  const { user } = session;
  const role = user.role || "user";
  const isAdmin = role === "admin";
  const balance = creditsResult?.balance ?? 0;

  return (
    <main className="min-h-screen p-8 bg-bg-secondary">
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-fg-primary">Informações</h2>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                isAdmin
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  : "bg-bg-tertiary text-fg-secondary"
              }`}
            >
              {role}
            </span>
          </div>

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

            <div className="flex items-center gap-2">
              <span className="text-fg-secondary">Permissão:</span>
              <span className="font-medium text-fg-primary">
                {isAdmin ? "Administrador" : "Usuário"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-bg-primary border border-border-primary rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-fg-primary">Preferências</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-fg-primary">Tema</p>
              <p className="text-sm text-fg-secondary">
                Escolha o tema da interface
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border-primary">
            <div>
              <p className="font-medium text-fg-primary">Temas Premium</p>
              <p className="text-sm text-fg-secondary">
                Personalize com cores e fontes exclusivas
              </p>
            </div>
            <Link
              href="/temas"
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-accent-fg text-sm font-medium rounded-lg transition-colors"
            >
              Ver Galeria
            </Link>
          </div>
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
                          tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
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
          className="px-4 py-2 bg-error hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Sair
        </button>
      </div>
    </main>
  );
}
