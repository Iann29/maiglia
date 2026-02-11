"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";

/**
 * Hook para gerenciar workspaces hierárquicos (parent + sub-workspaces)
 *
 * Hierarquia: Parent workspace (categoria) → Sub-workspaces (páginas)
 * Ex: Casa → Geral, Lista do Mercado, Rotina de Limpeza
 *
 * O conteúdo vive nos sub-workspaces, nunca diretamente nos pais.
 */
export function useWorkspaces(userId: string | undefined) {
  const [activeParentId, setActiveParentId] = useState<Id<"workspaces"> | null>(null);
  const [activeSubId, setActiveSubId] = useState<Id<"workspaces"> | null>(null);
  const hasCreatedDefault = useRef(false);
  const backfilledParents = useRef(new Set<string>());

  // Busca TODOS os workspaces do usuário (pais + filhos)
  const allWorkspaces = useQuery(
    api.workspaces.queries.list,
    userId ? { userId } : "skip"
  );

  // Mutations
  const createWorkspace = useMutation(api.workspaces.mutations.create);
  const updateWorkspace = useMutation(api.workspaces.mutations.update);
  const deleteWorkspace = useMutation(api.workspaces.mutations.remove);
  const reorderWorkspace = useMutation(api.workspaces.mutations.reorder);

  // Separa em árvore: pais e filhos por pai
  const { parents, childrenByParent } = useMemo(() => {
    if (!allWorkspaces) return { parents: [], childrenByParent: new Map<string, typeof allWorkspaces>() };

    const parentList = allWorkspaces
      .filter((w) => !w.parentId)
      .sort((a, b) => a.index.localeCompare(b.index));

    const childMap = new Map<string, typeof allWorkspaces>();
    for (const w of allWorkspaces) {
      if (w.parentId) {
        const children = childMap.get(w.parentId) ?? [];
        children.push(w);
        childMap.set(w.parentId, children);
      }
    }

    // Ordena filhos por index
    for (const [key, children] of childMap) {
      childMap.set(key, children.sort((a, b) => a.index.localeCompare(b.index)));
    }

    return { parents: parentList, childrenByParent: childMap };
  }, [allWorkspaces]);

  // Workspace pai ativo (fallback para o primeiro)
  const computedActiveParentId = useMemo(() => {
    if (activeParentId && parents.some((p) => p._id === activeParentId)) {
      return activeParentId;
    }
    return parents.length > 0 ? parents[0]._id : null;
  }, [activeParentId, parents]);

  // Filhos do pai ativo
  const activeChildren = useMemo(() => {
    if (!computedActiveParentId) return [];
    return childrenByParent.get(computedActiveParentId) ?? [];
  }, [computedActiveParentId, childrenByParent]);

  // Sub-workspace ativo (fallback para o primeiro filho)
  const computedActiveSubId = useMemo(() => {
    if (activeSubId && activeChildren.some((c) => c._id === activeSubId)) {
      return activeSubId;
    }
    return activeChildren.length > 0 ? activeChildren[0]._id : null;
  }, [activeSubId, activeChildren]);

  // Objetos computados
  const activeParent = parents.find((p) => p._id === computedActiveParentId) ?? null;
  const activeSubWorkspace = activeChildren.find((c) => c._id === computedActiveSubId) ?? null;

  // Cria workspace padrão se usuário não tiver nenhum
  useEffect(() => {
    if (userId && allWorkspaces && parents.length === 0 && !hasCreatedDefault.current) {
      hasCreatedDefault.current = true;
      createWorkspace({ userId, name: "Meu Espaço", emoji: "📋" });
    }
  }, [userId, allWorkspaces, parents.length, createWorkspace]);

  // Auto-cria "Geral" para pais existentes sem filhos (migração)
  useEffect(() => {
    if (!userId || !allWorkspaces) return;
    for (const parent of parents) {
      const children = childrenByParent.get(parent._id);
      if ((!children || children.length === 0) && !backfilledParents.current.has(parent._id)) {
        backfilledParents.current.add(parent._id);
        createWorkspace({ userId, name: "Geral", parentId: parent._id });
      }
    }
  }, [userId, allWorkspaces, parents, childrenByParent, createWorkspace]);

  // --- Ações ---

  const selectParent = useCallback((parentId: Id<"workspaces">) => {
    setActiveParentId(parentId);
    setActiveSubId(null);
  }, []);

  const selectSubWorkspace = useCallback((subId: Id<"workspaces">) => {
    setActiveSubId(subId);
  }, []);

  const createParent = useCallback(
    async (name: string, emoji?: string) => {
      if (!userId) return null;
      const id = await createWorkspace({ userId, name, emoji });
      setActiveParentId(id);
      setActiveSubId(null);
      return id;
    },
    [userId, createWorkspace]
  );

  const createSubWorkspace = useCallback(
    async (name: string, color?: string) => {
      if (!userId || !computedActiveParentId) return null;
      const id = await createWorkspace({ userId, name, color, parentId: computedActiveParentId });
      setActiveSubId(id);
      return id;
    },
    [userId, computedActiveParentId, createWorkspace]
  );

  const update = useCallback(
    async (workspaceId: Id<"workspaces">, updates: { name?: string; color?: string; emoji?: string }) => {
      await updateWorkspace({ workspaceId, ...updates });
    },
    [updateWorkspace]
  );

  const remove = useCallback(
    async (workspaceId: Id<"workspaces">) => {
      await deleteWorkspace({ workspaceId });

      if (workspaceId === activeParentId) {
        setActiveParentId(null);
        setActiveSubId(null);
      } else if (workspaceId === activeSubId) {
        setActiveSubId(null);
      }
    },
    [deleteWorkspace, activeParentId, activeSubId]
  );

  const reorder = useCallback(
    async (workspaceId: Id<"workspaces">, newIndex: string) => {
      await reorderWorkspace({ workspaceId, newIndex });
    },
    [reorderWorkspace]
  );

  return {
    // Dados
    parents,
    activeParent,
    activeParentId: computedActiveParentId,
    activeChildren,
    activeSubWorkspace,
    activeSubWorkspaceId: computedActiveSubId,
    isLoading: allWorkspaces === undefined,

    // Ações
    selectParent,
    selectSubWorkspace,
    createParent,
    createSubWorkspace,
    update,
    remove,
    reorder,
  };
}
