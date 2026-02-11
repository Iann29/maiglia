"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/ui/Loading";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { WorkspaceTabs } from "@/components/layout/WorkspaceTabs";
import { SubWorkspaceTabs } from "@/components/layout/SubWorkspaceTabs";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { PageTransition } from "@/components/ui/PageTransition";

/**
 * Layout principal do dashboard
 *
 * Estrutura:
 * - Header (logo, conta) — 56px
 * - WorkspaceTabs (categorias pai) — 40px
 * - SubWorkspaceTabs (páginas filhas) — 36px
 * - Área principal de conteúdo
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const userId = session?.user?.id;
  const {
    parents,
    activeParentId,
    activeChildren,
    activeSubWorkspaceId,
    isLoading: workspacesLoading,
    selectParent,
    selectSubWorkspace,
    createParent,
    createSubWorkspace,
    update,
    remove,
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

      {/* Duas linhas de tabs */}
      <div className="fixed top-14 left-0 right-0 z-40">
        {/* Linha 1: Workspaces pai (categorias) */}
        <WorkspaceTabs
          workspaces={parents}
          activeWorkspaceId={activeParentId}
          onSelect={(parentId) => {
            selectParent(parentId);
            if (pathname !== "/dashboard") {
              router.push("/dashboard");
            }
          }}
          onCreate={(name) => createParent(name)}
          onRename={(id, name) => update(id, { name })}
          onChangeColor={(id, color) => update(id, { color })}
          onChangeEmoji={(id, emoji) => update(id, { emoji })}
          onDelete={remove}
        />

        {/* Linha 2: Sub-workspaces (páginas) */}
        <SubWorkspaceTabs
          subWorkspaces={activeChildren}
          activeSubId={activeSubWorkspaceId}
          onSelect={(subId) => {
            selectSubWorkspace(subId);
            if (pathname !== "/dashboard") {
              router.push("/dashboard");
            }
          }}
          onCreate={(name) => createSubWorkspace(name)}
          onRename={(id, name) => update(id, { name })}
          onChangeColor={(id, color) => update(id, { color })}
          onDelete={remove}
        />
      </div>

      {/* Área principal (header 56px + parent tabs 40px + sub tabs 36px = 132px) */}
      <main className="fixed top-[132px] left-0 right-0 bottom-0 overflow-x-hidden overflow-y-auto overscroll-contain">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </>
  );
}
