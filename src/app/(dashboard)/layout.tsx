"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/Loading";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { WorkspaceTabs } from "@/components/layout/WorkspaceTabs";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useNodes } from "@/hooks/useNodes";
import { CanvasContext } from "@/components/canvas/InfiniteCanvas";

/**
 * Layout principal do dashboard
 * 
 * Estrutura:
 * - Header (logo, botão adicionar, conta)
 * - WorkspaceTabs (abas de workspaces)
 * - Canvas (área principal com nodes)
 * 
 * Gerencia autenticação e estado dos workspaces/nodes
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

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

  // Hook de nodes (precisa do workspaceId ativo)
  const { 
    nodes,
    createNode, 
    deleteNode, 
    deleteNodes,
    updateNode, 
    updateNodeImmediate,
    updateNodes,
    duplicateNode,
    reorderNode,
  } = useNodes(activeWorkspaceId);

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

  // Handler para adicionar node
  const handleAddNode = async () => {
    if (activeWorkspaceId) {
      await createNode("note");
    }
  };

  return (
    <>
      {/* Header fixo no topo */}
      <DashboardHeader onAddNode={handleAddNode} />

      {/* Abas de workspaces */}
      <div className="fixed top-14 left-0 right-0 z-40">
        <WorkspaceTabs
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelect={selectWorkspace}
          onCreate={(name) => createWorkspace(name)}
          onRename={(id, name) => updateWorkspace(id, { name })}
          onChangeColor={(id, color) => updateWorkspace(id, { color })}
          onDelete={removeWorkspace}
        />
      </div>

      {/* Área principal do canvas (top = header 56px + tabs 40px = 96px) */}
      <main className="fixed top-24 left-0 right-0 bottom-0 overflow-x-hidden overflow-y-auto">
        <CanvasContext.Provider value={{ 
          nodes,
          deleteNode, 
          deleteNodes,
          updateNode, 
          updateNodeImmediate,
          updateNodes,
          duplicateNode,
          reorderNode,
        }}>
          {children}
        </CanvasContext.Provider>
      </main>
    </>
  );
}
