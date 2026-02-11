"use client";

import { useSession, signOut, updateUser } from "@/lib/auth-client";
import Link from "next/link";
import { useQuery, usePaginatedQuery, useMutation } from "convex/react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { api } from "../../../../convex/_generated/api";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function MinhaContaPage() {
  const { data: session } = useSession();
  const creditsResult = useQuery(api.credits.queries.get);
  const { results: transactions, status, loadMore } = usePaginatedQuery(
    api.credits.queries.getTransactions,
    {},
    { initialNumItems: 20 }
  );

  const allThemes = useQuery(api.themes.queries.list);
  const { theme: activeTheme } = useActiveTheme();
  const setActiveTheme = useMutation(api.themes.mutations.setActive);

  const [activatingThemeId, setActivatingThemeId] = useState<Id<"themes"> | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSaveName = useCallback(async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setIsSavingName(true);
    const { error } = await updateUser({ name: trimmed });
    if (error) {
      setToast({ message: error.message ?? "Erro ao atualizar nome", type: "error" });
    } else {
      setToast({ message: "Nome atualizado!", type: "success" });
      setIsEditingName(false);
    }
    setIsSavingName(false);
  }, [editName]);

  const handleStartEditName = useCallback(() => {
    setEditName(session?.user?.name ?? "");
    setIsEditingName(true);
  }, [session?.user?.name]);

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

  const availableThemes = allThemes?.filter(t => t.isUnlocked) ?? [];
  const sortedThemes = [...availableThemes].sort((a, b) => {
    const aIsActive = activeTheme?._id === a._id;
    const bIsActive = activeTheme?._id === b._id;
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  const nameParts = user.name?.split(" ").filter(Boolean) ?? [];
  const initials = nameParts.length > 0
    ? nameParts.map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : (user.email?.[0] ?? "?").toUpperCase();

  return (
    <>
      <div className="min-h-full p-6 md:p-8 bg-bg-secondary">
        <motion.div
          className="max-w-3xl mx-auto space-y-6"
          initial="hidden"
          animate="visible"
        >
          {/* Breadcrumb + Title */}
          <motion.div
            variants={cardVariants}
            custom={0}
            className="space-y-2"
          >
            <Breadcrumb
              items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Minha Conta" },
              ]}
            />
            <h1 className="text-2xl font-bold text-fg-primary">Minha Conta</h1>
          </motion.div>

          {/* Profile Card */}
          <motion.div
            variants={cardVariants}
            custom={1}
            className="relative bg-bg-primary border border-border-primary rounded-xl shadow-sm overflow-hidden"
          >
            <div className="h-1 bg-accent" />
            <div className="p-6 flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-accent text-accent-fg flex items-center justify-center text-xl font-bold shrink-0 shadow-md">
                {initials}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                {/* Name */}
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName();
                          if (e.key === "Escape") setIsEditingName(false);
                        }}
                        autoFocus
                        className="flex-1 sm:w-56 px-3 py-1.5 text-sm bg-bg-secondary border border-border-primary rounded-lg text-fg-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                        placeholder="Seu nome"
                        maxLength={100}
                        disabled={isSavingName}
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSavingName || !editName.trim()}
                        className="px-3 py-1.5 text-sm font-medium bg-accent text-accent-fg rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                      >
                        {isSavingName ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        disabled={isSavingName}
                        className="px-3 py-1.5 text-sm text-fg-secondary hover:text-fg-primary transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : user.name ? (
                    <>
                      <h2 className="text-lg font-semibold text-fg-primary">{user.name}</h2>
                      <button
                        onClick={handleStartEditName}
                        className="p-1 rounded text-fg-muted hover:text-accent hover:bg-bg-secondary transition-colors"
                        title="Editar nome"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleStartEditName}
                      className="text-sm text-accent hover:text-accent-hover transition-colors"
                    >
                      + Adicionar nome
                    </button>
                  )}
                </div>

                {/* Email */}
                <p className="text-sm text-fg-secondary truncate">{user.email}</p>
              </div>
            </div>
          </motion.div>

          {/* Temas */}
          <motion.div
            variants={cardVariants}
            custom={2}
            className="bg-bg-primary border border-border-primary rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                    <path d="M20.66 8H12V2.34A10 10 0 0 1 20.66 8z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-fg-primary">Temas</h2>
                </div>
                <Link
                  href="/temas"
                  className="text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  Ver Galeria →
                </Link>
              </div>

              {allThemes === undefined && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-28 bg-bg-tertiary animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              )}

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

                        <h3 className="font-medium text-sm text-fg-primary truncate">
                          {theme.name}
                        </h3>

                        {isActive && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-fg">
                            Ativo
                          </span>
                        )}

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


            </div>
          </motion.div>

          {/* Créditos */}
          <motion.div
            variants={cardVariants}
            custom={3}
            className="bg-bg-primary border border-border-primary rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v12" />
                  <path d="M8 10h8" />
                  <path d="M8 14h8" />
                </svg>
                <h2 className="text-lg font-semibold text-fg-primary">Créditos</h2>
              </div>

              {/* Balance hero */}
              <div className="flex flex-col items-center py-4 rounded-lg bg-bg-secondary border border-border-secondary">
                <span className="text-4xl font-bold text-fg-primary tabular-nums">
                  {creditsResult === undefined ? "..." : balance}
                </span>
                <span className="text-sm text-fg-secondary mt-1">créditos disponíveis</span>
              </div>

              <p className="text-sm text-fg-secondary text-center">
                Ganhe créditos criando workspaces e blocos. Use para desbloquear temas premium.
              </p>

              {/* Histórico */}
              <div className="pt-4 border-t border-border-primary">
                <h3 className="text-sm font-semibold text-fg-secondary mb-3">Histórico de Transações</h3>

                {status === "LoadingFirstPage" && (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-bg-tertiary animate-pulse rounded-lg" />
                    ))}
                  </div>
                )}

                {transactions.length === 0 && status === "Exhausted" && (
                  <p className="text-sm text-fg-muted py-6 text-center">
                    Nenhuma transação ainda. Crie workspaces e blocos para ganhar créditos!
                  </p>
                )}

                {transactions.length > 0 && (
                  <>
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {transactions.map((tx) => {
                        const isPositive = tx.amount > 0;
                        return (
                          <div
                            key={tx._id}
                            className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-bg-secondary transition-colors"
                            style={{ borderLeft: `3px solid ${isPositive ? "var(--success)" : "var(--error)"}` }}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isPositive ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                              {isPositive ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 19V5" />
                                  <path d="m5 12 7-7 7 7" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 5v14" />
                                  <path d="m5 12 7 7 7-7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-fg-primary truncate">{tx.reason}</p>
                              <p className="text-xs text-fg-muted">{formatDate(tx.createdAt)}</p>
                            </div>
                            <span
                              className={`text-sm font-semibold ml-3 tabular-nums ${isPositive ? "text-success" : "text-error"}`}
                            >
                              {isPositive ? "+" : ""}
                              {tx.amount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {status === "CanLoadMore" && (
                      <button
                        onClick={() => loadMore(20)}
                        className="w-full mt-3 py-2 text-sm text-accent hover:text-accent-hover font-medium rounded-lg hover:bg-bg-secondary transition-colors"
                      >
                        Carregar mais
                      </button>
                    )}
                    {status === "LoadingMore" && (
                      <div className="w-full mt-3 py-2 text-sm text-fg-muted text-center">
                        Carregando...
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Logout */}
          <motion.div variants={cardVariants} custom={4} className="pt-2 pb-4">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-fg-secondary border border-border-primary rounded-xl hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair da conta
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Global floating toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            role="alert"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm ${
              toast.type === "success"
                ? "bg-success/90 text-white"
                : "bg-error/90 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
