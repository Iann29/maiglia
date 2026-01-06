"use client";

import { useSession, signOut } from "@/lib/auth-client";
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
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Minha Conta</h1>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Informações</h2>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                isAdmin
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {role}
            </span>
          </div>

          <div className="space-y-3">
            {user.name && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Nome:</span>
                <span className="font-medium">{user.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                Permissão:
              </span>
              <span className="font-medium">
                {isAdmin ? "Administrador" : "Usuário"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Sair
        </button>
      </div>
    </main>
  );
}
