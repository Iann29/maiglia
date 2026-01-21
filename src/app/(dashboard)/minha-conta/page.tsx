"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export default function MinhaContaPage() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  const { user } = session;
  const role = user.role || "user";
  const isAdmin = role === "admin";

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
