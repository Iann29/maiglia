"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/ui/Loading";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SubWorkspaceTabs } from "@/components/layout/SubWorkspaceTabs";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { PageTransition } from "@/components/ui/PageTransition";

/**
 * Layout principal do dashboard
 *
 * Estrutura:
 * - Header (logo, workspace tabs, créditos, conta) — 56px
 * - SubWorkspaceTabs (páginas fixas) — 56px
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
    activeParent,
    activeParentId,
    activeChildren,
    activeSubWorkspaceId,
    isLoading: workspacesLoading,
    selectParent,
    selectSubWorkspace,
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
      {/* Header com workspace tabs integrados */}
      <DashboardHeader
        workspaces={parents}
        activeWorkspaceId={activeParentId}
        onSelectWorkspace={(parentId) => {
          selectParent(parentId);
          if (pathname !== "/dashboard") {
            router.push("/dashboard");
          }
        }}
      />

      {/* Sub-workspaces (páginas) */}
      <div className="fixed top-14 left-0 right-0 z-40">
        <SubWorkspaceTabs
          subWorkspaces={activeChildren}
          activeSubId={activeSubWorkspaceId}
          parentColor={activeParent?.color ?? "#3b82f6"}
          onSelect={(subId) => {
            selectSubWorkspace(subId);
            if (pathname !== "/dashboard") {
              router.push("/dashboard");
            }
          }}
        />
      </div>

      {/* Área principal (header 56px + sub tabs 56px = 112px) */}
      <main className="fixed top-[112px] left-0 right-0 bottom-0 overflow-x-hidden overflow-y-auto overscroll-contain">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </>
  );
}
