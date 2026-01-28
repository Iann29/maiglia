"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useCallback, useMemo, useRef } from "react";

/**
 * Hook para gerenciar workspaces do usuário
 * 
 * Funcionalidades:
 * - Lista workspaces do usuário
 * - CRUD de workspaces
 * - Gerencia workspace ativo (aba selecionada)
 * - Cria workspace padrão se usuário não tiver nenhum
 */
export function useWorkspaces(userId: string | undefined) {
  // Estado local para workspace ativo
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<Id<"workspaces"> | null>(null);
  const hasCreatedDefault = useRef(false);

  // Queries do Convex
  const workspaces = useQuery(
    api.workspaces.queries.list,
    userId ? { userId } : "skip"
  );

  // Mutations do Convex
  const createWorkspace = useMutation(api.workspaces.mutations.create);
  const updateWorkspace = useMutation(api.workspaces.mutations.update);
  const deleteWorkspace = useMutation(api.workspaces.mutations.remove);
  const reorderWorkspace = useMutation(api.workspaces.mutations.reorder);

  // Calcula workspace ativo baseado nos dados
  const computedActiveId = useMemo(() => {
    // Se já tem um selecionado manualmente, usa ele
    if (activeWorkspaceId && workspaces?.some((w) => w._id === activeWorkspaceId)) {
      return activeWorkspaceId;
    }
    // Senão, usa o primeiro da lista
    if (workspaces && workspaces.length > 0) {
      return workspaces[0]._id;
    }
    return null;
  }, [activeWorkspaceId, workspaces]);

  // Cria workspace padrão se usuário não tiver nenhum (chamado uma vez)
  useMemo(() => {
    if (userId && workspaces && workspaces.length === 0 && !hasCreatedDefault.current) {
      hasCreatedDefault.current = true;
      createWorkspace({ userId, name: "Meu Workspace" });
    }
  }, [userId, workspaces, createWorkspace]);

  // Funções de ação
  const create = useCallback(
    async (name: string, color?: string) => {
      if (!userId) return null;
      const id = await createWorkspace({ userId, name, color });
      setActiveWorkspaceId(id);
      return id;
    },
    [userId, createWorkspace]
  );

  const update = useCallback(
    async (workspaceId: Id<"workspaces">, updates: { name?: string; color?: string }) => {
      await updateWorkspace({ workspaceId, ...updates });
    },
    [updateWorkspace]
  );

  const remove = useCallback(
    async (workspaceId: Id<"workspaces">) => {
      try {
        await deleteWorkspace({ workspaceId });
        
        // Se deletou o workspace ativo, seleciona outro
        if (workspaceId === activeWorkspaceId && workspaces) {
          const remaining = workspaces.filter((w) => w._id !== workspaceId);
          if (remaining.length > 0) {
            setActiveWorkspaceId(remaining[0]._id);
          } else {
            setActiveWorkspaceId(null);
          }
        }
      } catch (error) {
        // Não altera estado local se falhou
        console.error("Erro ao deletar workspace:", error);
        throw error;
      }
    },
    [deleteWorkspace, activeWorkspaceId, workspaces]
  );

  const reorder = useCallback(
    async (workspaceId: Id<"workspaces">, newIndex: string) => {
      await reorderWorkspace({ workspaceId, newIndex });
    },
    [reorderWorkspace]
  );

  const selectWorkspace = useCallback((workspaceId: Id<"workspaces">) => {
    setActiveWorkspaceId(workspaceId);
  }, []);

  // Workspace ativo
  const activeWorkspace = workspaces?.find((w) => w._id === computedActiveId) ?? null;

  return {
    // Estado
    workspaces: workspaces ?? [],
    activeWorkspace,
    activeWorkspaceId: computedActiveId,
    isLoading: workspaces === undefined,

    // Ações
    create,
    update,
    remove,
    reorder,
    selectWorkspace,
  };
}
