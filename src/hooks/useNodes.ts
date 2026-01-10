"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "@/components/canvas/useCanvasStore";
import type { CanvasNode } from "@/components/canvas/canvas-types";

/**
 * Hook para sincronizar nodes entre Convex (banco) e Zustand (UI local)
 * 
 * Estratégia de sincronização:
 * 1. Busca nodes do Convex quando workspace muda
 * 2. Popula Zustand com os dados
 * 3. Mutations são chamadas em debounce para salvar alterações
 * 4. UI usa Zustand para responsividade imediata
 */
export function useNodes(workspaceId: Id<"workspaces"> | null) {
  // Query do Convex
  const convexNodes = useQuery(
    api.nodes.queries.listByWorkspace,
    workspaceId ? { workspaceId } : "skip"
  );

  // Mutations do Convex
  const createNodeMutation = useMutation(api.nodes.mutations.create);
  const updateNodeMutation = useMutation(api.nodes.mutations.update);
  const deleteNodeMutation = useMutation(api.nodes.mutations.remove);
  const duplicateNodeMutation = useMutation(api.nodes.mutations.duplicate);
  const reorderNodeMutation = useMutation(api.nodes.mutations.reorder);

  // Zustand store
  const {
    nodes: localNodes,
    setNodes,
    updateNodeLocal,
    deleteNodeLocal,
  } = useCanvasStore();

  // Ref para debounce
  const updateTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Sincroniza Convex → Zustand quando dados chegam
  useEffect(() => {
    if (convexNodes) {
      // Converte formato Convex para formato local
      const formatted: CanvasNode[] = convexNodes.map((node) => ({
        id: node._id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        color: node.color,
        index: node.index,
        title: node.title,
        titleAlign: node.titleAlign,
        type: node.type,
        content: node.content,
      }));
      setNodes(formatted);
    }
  }, [convexNodes, setNodes]);

  // Cria node (local + Convex)
  const createNode = useCallback(
    async (type: "note" | "table" | "checklist" = "note") => {
      if (!workspaceId) return null;

      // Cria no Convex
      const nodeId = await createNodeMutation({
        workspaceId,
        type,
      });

      return nodeId;
    },
    [workspaceId, createNodeMutation]
  );

  // Atualiza node (local imediato + Convex com debounce)
  const updateNode = useCallback(
    (nodeId: string, updates: Partial<CanvasNode>) => {
      // Atualiza local imediatamente para UI responsiva
      updateNodeLocal(nodeId, updates);

      // Cancela timeout anterior se existir
      const existingTimeout = updateTimeoutRef.current.get(nodeId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Debounce: salva no Convex após 500ms de inatividade
      const timeout = setTimeout(async () => {
        try {
          await updateNodeMutation({
            nodeId: nodeId as Id<"nodes">,
            x: updates.x,
            y: updates.y,
            width: updates.width,
            height: updates.height,
            color: updates.color,
            title: updates.title,
            titleAlign: updates.titleAlign,
            content: updates.content,
          });
        } catch (error) {
          console.error("Erro ao salvar node:", error);
        }
        updateTimeoutRef.current.delete(nodeId);
      }, 500);

      updateTimeoutRef.current.set(nodeId, timeout);
    },
    [updateNodeLocal, updateNodeMutation]
  );

  // Deleta node
  const deleteNode = useCallback(
    async (nodeId: string) => {
      // Cancela qualquer update pendente
      const timeout = updateTimeoutRef.current.get(nodeId);
      if (timeout) {
        clearTimeout(timeout);
        updateTimeoutRef.current.delete(nodeId);
      }

      // Remove local
      deleteNodeLocal(nodeId);

      // Remove do Convex
      await deleteNodeMutation({ nodeId: nodeId as Id<"nodes"> });
    },
    [deleteNodeLocal, deleteNodeMutation]
  );

  // Duplica node
  const duplicateNode = useCallback(
    async (nodeId: string) => {
      const newNodeId = await duplicateNodeMutation({
        nodeId: nodeId as Id<"nodes">,
      });
      return newNodeId;
    },
    [duplicateNodeMutation]
  );

  // Reordena (z-index)
  const reorderNode = useCallback(
    async (nodeId: string, newIndex: string) => {
      // Atualiza local
      updateNodeLocal(nodeId, { index: newIndex });

      // Atualiza Convex
      await reorderNodeMutation({
        nodeId: nodeId as Id<"nodes">,
        newIndex,
      });
    },
    [updateNodeLocal, reorderNodeMutation]
  );

  // Cleanup timeouts ao desmontar
  useEffect(() => {
    const timeouts = updateTimeoutRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return {
    nodes: localNodes,
    isLoading: convexNodes === undefined,
    createNode,
    updateNode,
    deleteNode,
    duplicateNode,
    reorderNode,
  };
}
