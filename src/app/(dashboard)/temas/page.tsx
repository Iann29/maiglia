"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { useState } from "react";
import { ThemePreviewModal } from "@/components/ThemePreviewModal";
import type { Id } from "../../../../convex/_generated/dataModel";

interface ThemeItem {
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

export default function TemasPage() {
  const themes = useQuery(api.themes.queries.list);
  const { theme: activeTheme } = useActiveTheme();
  const seedThemes = useMutation(api.themes.mutations.seedInitialThemes);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeItem | null>(null);

  const isLoading = themes === undefined;

  const handleSeedThemes = async () => {
    setIsSeeding(true);
    try {
      await seedThemes();
    } catch (error) {
      console.error("Erro ao popular temas:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-bg-secondary">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-fg-primary">Galeria de Temas</h1>
          <Link
            href="/dashboard"
            className="text-sm text-accent hover:text-accent-hover"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>

        <p className="text-fg-secondary">
          Personalize sua experiência escolhendo um tema. Temas premium podem ser desbloqueados com créditos.
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 bg-bg-tertiary animate-pulse rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Grid de Temas */}
        {!isLoading && themes && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => {
              const isActive = activeTheme?._id === theme._id;
              const isUnlocked = theme.isUnlocked;
              const isFree = theme.price === 0;

              return (
                <button
                  key={theme._id}
                  onClick={() => setSelectedTheme(theme as ThemeItem)}
                  className={`
                    relative p-4 rounded-lg border transition-all text-left cursor-pointer
                    ${isActive
                      ? "border-accent ring-2 ring-accent/30 bg-bg-primary"
                      : "border-border-primary bg-bg-primary hover:border-accent/50"
                    }
                  `}
                >
                  {/* Preview de Cores */}
                  <div className="mb-4 h-24 rounded-md overflow-hidden grid grid-cols-3 gap-px">
                    <div
                      className="col-span-2 row-span-2"
                      style={{ backgroundColor: theme.colors.bgPrimary }}
                    >
                      <div className="p-2 flex flex-col gap-1">
                        <div
                          className="h-3 w-16 rounded"
                          style={{ backgroundColor: theme.colors.fgPrimary }}
                        />
                        <div
                          className="h-2 w-12 rounded opacity-60"
                          style={{ backgroundColor: theme.colors.fgSecondary }}
                        />
                      </div>
                    </div>
                    <div
                      style={{ backgroundColor: theme.colors.bgSecondary }}
                    />
                    <div
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>

                  {/* Nome e Fonte */}
                  <h3 className="font-semibold text-fg-primary mb-1">{theme.name}</h3>
                  <p className="text-xs text-fg-secondary mb-3">Fonte: {theme.font}</p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {isActive && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-accent text-accent-fg">
                        Ativo
                      </span>
                    )}

                    {isFree ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Gratuito
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-bg-tertiary text-fg-secondary">
                        {theme.price} créditos
                      </span>
                    )}

                    {!isUnlocked && !isFree && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Bloqueado
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && themes && themes.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-fg-secondary">Nenhum tema disponível no momento.</p>
            <button
              onClick={handleSeedThemes}
              disabled={isSeeding}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-accent-fg rounded-lg transition-colors disabled:opacity-50"
            >
              {isSeeding ? "Carregando temas..." : "Carregar Temas Iniciais"}
            </button>
          </div>
        )}
      </div>

      {/* Modal de Preview */}
      {selectedTheme && (
        <ThemePreviewModal
          theme={selectedTheme}
          isActive={activeTheme?._id === selectedTheme._id}
          onClose={() => setSelectedTheme(null)}
        />
      )}
    </main>
  );
}
