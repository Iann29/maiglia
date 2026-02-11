"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/ui/Loading";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { WorkspaceTabs } from "@/components/layout/WorkspaceTabs";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { PageTransition } from "@/components/ui/PageTransition";

/**
 * Layout principal do dashboard
 * 
 * Estrutura:
 * - Header (logo, botão adicionar, conta)
 * - WorkspaceTabs (abas de workspaces)
 * - Área principal de conteúdo
 * 
 * Gerencia autenticação e estado dos workspaces
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Hook de workspaces (precisa do userId)
  const userId = session?.user?.id;
  const {
    workspaces,
    activeWorkspaceId,
    isLoading: workspacesLoading,
    create: createWorkspace,
    update: updateWorkspace,
    remove: removeWorkspace,
    selectWorkspace,
  } = useWorkspaces(userId);

  // Redireciona se não autenticado
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Loading state
  if (isPending || workspacesLoading) {
    if (typeof window !== "undefined") {
      const justLoggedIn = sessionStorage.getItem("maiglia-just-logged-in");
      if (justLoggedIn) {
        sessionStorage.removeItem("maiglia-just-logged-in");
        return null;
      }
    }
    return <Loading />;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      {/* Header fixo no topo */}
      <DashboardHeader />

      {/* Abas de workspaces */}
      <div className="fixed top-14 left-0 right-0 z-40">
        <WorkspaceTabs
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelect={(workspaceId) => {
            selectWorkspace(workspaceId);
            // Navega para o dashboard se estiver em outra página
            if (pathname !== "/dashboard") {
              router.push("/dashboard");
            }
          }}
          onCreate={(name) => createWorkspace(name)}
          onRename={(id, name) => updateWorkspace(id, { name })}
          onChangeColor={(id, color) => updateWorkspace(id, { color })}
          onDelete={removeWorkspace}
        />
      </div>

      {/* Área principal (top = header 56px + tabs 40px = 96px) */}
      <main className="fixed top-24 left-0 right-0 bottom-0 overflow-x-hidden overflow-y-auto overscroll-contain">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </>
  );
}
