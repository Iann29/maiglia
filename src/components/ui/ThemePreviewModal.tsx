"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useCallback, useEffect } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

interface ThemeData {
  _id: Id<"themes">;
  name: string;
  slug: string;
  description: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    fgPrimary: string;
    fgSecondary: string;
    accent: string;
    accentHover: string;
  };
  font: string;
  isDefault: boolean;
  price: number;
  isUnlocked: boolean;
}

interface ThemePreviewModalProps {
  theme: ThemeData;
  isActive: boolean;
  onClose: () => void;
}

export function ThemePreviewModal({
  theme,
  isActive,
  onClose,
}: ThemePreviewModalProps) {
  const unlockTheme = useMutation(api.themes.mutations.unlock);
  const setActiveTheme = useMutation(api.themes.mutations.setActive);
  const creditsResult = useQuery(api.credits.queries.get);

  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const balance = creditsResult?.balance ?? 0;
  const isFree = theme.price === 0;
  const canAfford = balance >= theme.price;

  // Auto-dismiss toast after 3s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleUnlock = useCallback(async () => {
    setIsUnlocking(true);
    try {
      await unlockTheme({ themeId: theme._id });
      setToast({ message: `Tema "${theme.name}" desbloqueado!`, type: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao desbloquear tema";
      setToast({ message, type: "error" });
    } finally {
      setIsUnlocking(false);
    }
  }, [unlockTheme, theme._id, theme.name]);

  const handleActivate = useCallback(async () => {
    setIsActivating(true);
    try {
      await setActiveTheme({ themeId: theme._id });
      setToast({ message: `Tema "${theme.name}" ativado!`, type: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao ativar tema";
      setToast({ message, type: "error" });
    } finally {
      setIsActivating(false);
    }
  }, [setActiveTheme, theme._id, theme.name]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-bg-primary border border-border-primary rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview visual do tema */}
        <div
          className="p-6 space-y-3"
          style={{ backgroundColor: theme.colors.bgPrimary }}
        >
          {/* Simulação de interface com as cores do tema */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg"
              style={{ backgroundColor: theme.colors.accent }}
            />
            <div className="space-y-1 flex-1">
              <div
                className="h-3 w-32 rounded"
                style={{ backgroundColor: theme.colors.fgPrimary }}
              />
              <div
                className="h-2 w-24 rounded opacity-60"
                style={{ backgroundColor: theme.colors.fgSecondary }}
              />
            </div>
          </div>

          <div
            className="rounded-lg p-4 space-y-2"
            style={{ backgroundColor: theme.colors.bgSecondary }}
          >
            <div
              className="h-3 w-full rounded"
              style={{ backgroundColor: theme.colors.fgPrimary, opacity: 0.7 }}
            />
            <div
              className="h-3 w-3/4 rounded"
              style={{ backgroundColor: theme.colors.fgSecondary, opacity: 0.5 }}
            />
            <div
              className="h-3 w-1/2 rounded"
              style={{ backgroundColor: theme.colors.fgSecondary, opacity: 0.3 }}
            />
          </div>

          <div className="flex gap-2">
            <div
              className="h-8 px-4 rounded-lg flex items-center"
              style={{
                backgroundColor: theme.colors.accent,
              }}
            >
              <div
                className="h-2 w-12 rounded"
                style={{ backgroundColor: theme.colors.bgPrimary }}
              />
            </div>
            <div
              className="h-8 px-4 rounded-lg flex items-center border"
              style={{
                borderColor: theme.colors.fgSecondary,
              }}
            >
              <div
                className="h-2 w-16 rounded"
                style={{ backgroundColor: theme.colors.fgSecondary }}
              />
            </div>
          </div>
        </div>

        {/* Conteudo do modal */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-fg-primary">{theme.name}</h2>
            <p className="text-sm text-fg-secondary mt-1">{theme.description}</p>
            <p className="text-xs text-fg-secondary mt-2">
              Fonte: <span className="font-medium">{theme.font}</span>
            </p>
          </div>

          {/* Preço / Status */}
          <div className="flex items-center gap-3">
            {isFree ? (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Gratuito
              </span>
            ) : (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-bg-tertiary text-fg-secondary">
                {theme.price} créditos
              </span>
            )}

            {isActive && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-accent text-accent-fg">
                Tema Ativo
              </span>
            )}

            {theme.isUnlocked && !isActive && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Desbloqueado
              </span>
            )}
          </div>

          {/* Saldo atual (se tema não é gratuito e não desbloqueado) */}
          {!isFree && !theme.isUnlocked && (
            <p className="text-xs text-fg-secondary">
              Seu saldo: <span className="font-medium">{balance}</span> créditos
              {!canAfford && (
                <span className="text-red-500 ml-1">
                  (insuficiente)
                </span>
              )}
            </p>
          )}

          {/* Botoes de acao */}
          <div className="flex gap-3">
            {/* Botao Desbloquear */}
            {!theme.isUnlocked && !isFree && (
              <button
                onClick={handleUnlock}
                disabled={isUnlocking || !canAfford}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-accent hover:bg-accent-hover text-accent-fg"
              >
                {isUnlocking
                  ? "Desbloqueando..."
                  : `Desbloquear por ${theme.price} créditos`}
              </button>
            )}

            {/* Botao Ativar */}
            {(theme.isUnlocked || isFree) && !isActive && (
              <button
                onClick={handleActivate}
                disabled={isActivating}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 bg-accent hover:bg-accent-hover text-accent-fg"
              >
                {isActivating ? "Ativando..." : "Ativar Tema"}
              </button>
            )}

            {/* Botao Fechar */}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg font-medium text-sm transition-colors border border-border-primary text-fg-secondary hover:bg-bg-secondary"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`absolute bottom-4 left-4 right-4 px-4 py-3 rounded-lg text-sm font-medium transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
