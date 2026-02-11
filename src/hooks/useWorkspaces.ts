"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";

/**
 * Hook para navegar entre workspaces fixos (parent + sub-workspaces)
 *
 * Os workspaces são pré-definidos e criados automaticamente via seed.
 * Este hook expõe apenas navegação — sem CRUD.
 *
 * Hierarquia: Parent workspace (categoria) → Sub-workspaces (páginas)
 * Ex: Casa → Lista do Mercado, Rotina de Limpeza, Compras e Afazeres
 */
export function useWorkspaces(userId: string | undefined) {
  const [activeParentId, setActiveParentId] = useState<Id<"workspaces"> | null>(null);
  const [activeSubId, setActiveSubId] = useState<Id<"workspaces"> | null>(null);
  const hasSeeded = useRef(false);

  const allWorkspaces = useQuery(
    api.workspaces.queries.list,
    userId ? { userId } : "skip"
  );

  const seedWorkspaces = useMutation(api.workspaces.seed.seedFixedWorkspaces);

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

  const activeParent = parents.find((p) => p._id === computedActiveParentId) ?? null;
  const activeSubWorkspace = activeChildren.find((c) => c._id === computedActiveSubId) ?? null;

  // Seed dos workspaces fixos para novos usuários
  useEffect(() => {
    if (userId && allWorkspaces && allWorkspaces.length === 0 && !hasSeeded.current) {
      hasSeeded.current = true;
      seedWorkspaces({ userId });
    }
  }, [userId, allWorkspaces, seedWorkspaces]);

  // --- Navegação ---

  const selectParent = useCallback((parentId: Id<"workspaces">) => {
    setActiveParentId(parentId);
    setActiveSubId(null);
  }, []);

  const selectSubWorkspace = useCallback((subId: Id<"workspaces">) => {
    setActiveSubId(subId);
  }, []);

  return {
    parents,
    activeParent,
    activeParentId: computedActiveParentId,
    activeChildren,
    activeSubWorkspace,
    activeSubWorkspaceId: computedActiveSubId,
    isLoading: allWorkspaces === undefined,
    selectParent,
    selectSubWorkspace,
  };
}
