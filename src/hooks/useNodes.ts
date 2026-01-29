"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCallback, useMemo, useRef } from "react";
import {
  NODE_COLORS,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  CANVAS_PADDING,
  GRID_SIZE,
} from "@/constants/canvas";

// Tipo do node do Convex
type ConvexNode = {
  _id: Id<"nodes">;
  _creationTime: number;
  clientId?: string; // Opcional para backward compat com nodes existentes
  workspaceId: Id<"workspaces">;
  type: "note" | "table" | "checklist" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  index: string;
  title: string;
  titleAlign: "left" | "center" | "right";
  icon?: string; // Emoji/ícone do node
  content?: unknown;
  createdAt: number;
  updatedAt: number;
};

/**
 * Hook para gerenciar nodes com Optimistic Updates usando Client-Generated UUIDs
 * 
 * Estratégia (padrão usado por Notion, Figma, Linear):
 * 1. Cliente gera UUID via crypto.randomUUID() antes de chamar mutation
 * 2. Optimistic update adiciona node com esse clientId imediatamente
 * 3. Servidor armazena o mesmo clientId, não há "troca de IDs"
 * 4. Frontend usa clientId como identificador principal
 * 5. _serverId (Convex _id) é usado apenas para mutations no backend
 */
export function useNodes(workspaceId: Id<"workspaces"> | null) {
  // Query do Convex - dados vêm diretamente daqui
  const convexNodes = useQuery(
    api.nodes.queries.listByWorkspace,
    workspaceId ? { workspaceId } : "skip"
  );

  // Ref para debounce de updates
  const updateTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // === MUTATIONS ===

  // Criar node - COM optimistic update usando clientId
  // O cliente gera o UUID, então podemos fazer optimistic update com o ID real!
  const createNodeMutation = useMutation(api.nodes.mutations.create).withOptimisticUpdate(
    (localStore, args) => {
      const currentNodes = localStore.getQuery(api.nodes.queries.listByWorkspace, { workspaceId: args.workspaceId });
      if (currentNodes === undefined) return;
      
      // Calcula próximo index
      let newIndex = "a";
      if (currentNodes.length > 0) {
        const sorted = [...currentNodes].sort((a, b) => a.index.localeCompare(b.index));
        newIndex = sorted[sorted.length - 1].index + "a";
      }

      // Calcula posição se não fornecida
      let x = args.x ?? CANVAS_PADDING;
      let y = args.y ?? CANVAS_PADDING;
      if (args.x === undefined && args.y === undefined) {
        const col = currentNodes.length % 5;
        const row = Math.floor(currentNodes.length / 5);
        x = CANVAS_PADDING + col * (DEFAULT_NODE_WIDTH + GRID_SIZE);
        y = CANVAS_PADDING + row * (DEFAULT_NODE_HEIGHT + GRID_SIZE);
      }

      // Conteúdo inicial baseado no tipo
      let initialContent: unknown = undefined;
      if (args.type === "image" && args.imageUrl) {
        initialContent = { imageUrl: args.imageUrl };
      } else if (args.type === "checklist") {
        initialContent = { items: [{ id: crypto.randomUUID(), text: "", checked: false }] };
      }

      // Node otimista com _id temporário mas clientId real
      const tempNode: ConvexNode = {
        _id: `temp_${args.clientId}` as Id<"nodes">,
        _creationTime: Date.now(),
        clientId: args.clientId, // Este é o identificador real!
        workspaceId: args.workspaceId,
        type: args.type,
        x,
        y,
        width: args.width ?? DEFAULT_NODE_WIDTH,
        height: args.height ?? DEFAULT_NODE_HEIGHT,
        color: args.color ?? NODE_COLORS[0], // Usa cor fornecida, fallback para primeira cor
        index: newIndex,
        title: args.title ?? "",
        titleAlign: "center",
        icon: args.icon,
        content: initialContent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      localStore.setQuery(
        api.nodes.queries.listByWorkspace,
        { workspaceId: args.workspaceId },
        [...currentNodes, tempNode]
      );
    }
  );

  // Deletar um node - remove instantaneamente do cache (filtra por clientId)
  const deleteNodeMutation = useMutation(api.nodes.mutations.remove).withOptimisticUpdate(
    (localStore, args) => {
      if (!workspaceId) return;
      
      const currentNodes = localStore.getQuery(api.nodes.queries.listByWorkspace, { workspaceId });
      if (currentNodes === undefined) return;

      // Filtra por _id (que é o que a mutation recebe)
      localStore.setQuery(
        api.nodes.queries.listByWorkspace,
        { workspaceId },
        currentNodes.filter((n) => n._id !== args.nodeId)
      );
    }
  );

  // Deletar múltiplos nodes - remove todos instantaneamente
  const deleteManyMutation = useMutation(api.nodes.mutations.removeMany).withOptimisticUpdate(
    (localStore, args) => {
      if (!workspaceId) return;
      
      const currentNodes = localStore.getQuery(api.nodes.queries.listByWorkspace, { workspaceId });
      if (currentNodes === undefined) return;

      const nodeIdsToDelete = new Set(args.nodeIds.map(id => id.toString()));
      localStore.setQuery(
        api.nodes.queries.listByWorkspace,
        { workspaceId },
        currentNodes.filter((n) => !nodeIdsToDelete.has(n._id.toString()))
      );
    }
  );

  // Atualizar node - COM optimistic update para TODOS os campos
  // O estado local de drag no CanvasNode isola o visual durante arrasto
  // O optimistic update garante que ao soltar, o cache já tem a posição final
  const updateNodeMutation = useMutation(api.nodes.mutations.update).withOptimisticUpdate(
    (localStore, args) => {
      if (!workspaceId) return;
      
      const currentNodes = localStore.getQuery(api.nodes.queries.listByWorkspace, { workspaceId });
      if (currentNodes === undefined) return;

      localStore.setQuery(
        api.nodes.queries.listByWorkspace,
        { workspaceId },
        currentNodes.map((n) => 
          n._id === args.nodeId 
            ? { 
                ...n, 
                ...(args.x !== undefined && { x: args.x }),
                ...(args.y !== undefined && { y: args.y }),
                ...(args.width !== undefined && { width: args.width }),
                ...(args.height !== undefined && { height: args.height }),
                ...(args.color !== undefined && { color: args.color }),
                ...(args.title !== undefined && { title: args.title }),
                ...(args.titleAlign !== undefined && { titleAlign: args.titleAlign }),
                ...(args.icon !== undefined && { icon: args.icon || undefined }), // string vazia = remover
                ...(args.content !== undefined && { content: args.content }),
                updatedAt: Date.now(),
              } 
            : n
        )
      );
    }
  );
  
  // Atualizar múltiplos nodes - para movimento em grupo
  const updateManyMutation = useMutation(api.nodes.mutations.updateMany).withOptimisticUpdate(
    (localStore, args) => {
      if (!workspaceId) return;
      
      const currentNodes = localStore.getQuery(api.nodes.queries.listByWorkspace, { workspaceId });
      if (currentNodes === undefined) return;

      const updatesMap = new Map(args.updates.map(u => [u.nodeId.toString(), u]));
      
      localStore.setQuery(
        api.nodes.queries.listByWorkspace,
        { workspaceId },
        currentNodes.map((n) => {
          const update = updatesMap.get(n._id.toString());
          if (!update) return n;
          return {
            ...n,
            ...(update.x !== undefined && { x: update.x }),
            ...(update.y !== undefined && { y: update.y }),
            ...(update.width !== undefined && { width: update.width }),
            ...(update.height !== undefined && { height: update.height }),
            updatedAt: Date.now(),
          };
        })
      );
    }
  );

  // Duplicar node
  const duplicateNodeMutation = useMutation(api.nodes.mutations.duplicate).withOptimisticUpdate(
    (localStore, args) => {
      if (!workspaceId) return;
      
      const currentNodes = localStore.getQuery(api.nodes.queries.listByWorkspace, { workspaceId });
      if (currentNodes === undefined) return;

      // Encontra o node original
      const original = currentNodes.find(n => n._id === args.nodeId);
      if (!original) return;

      // Calcula próximo index
      const sorted = [...currentNodes].sort((a, b) => a.index.localeCompare(b.index));
      const newIndex = sorted[sorted.length - 1].index + "a";

      // Node duplicado otimista (clientId é gerado pelo cliente)
      const duplicatedNode: ConvexNode = {
        _id: `temp_${args.clientId}` as Id<"nodes">,
        _creationTime: Date.now(),
        clientId: args.clientId, // UUID gerado pelo cliente para o node duplicado
        workspaceId: original.workspaceId,
        type: original.type,
        x: original.x + GRID_SIZE,
        y: original.y + GRID_SIZE,
        width: original.width,
        height: original.height,
        color: original.color,
        index: newIndex,
        title: original.title,
        titleAlign: original.titleAlign,
        content: original.content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      localStore.setQuery(
        api.nodes.queries.listByWorkspace,
        { workspaceId },
        [...currentNodes, duplicatedNode]
      );
    }
  );

  // Reordenar node (z-index)
  const reorderNodeMutation = useMutation(api.nodes.mutations.reorder).withOptimisticUpdate(
    (localStore, args) => {
      if (!workspaceId) return;
      
      const currentNodes = localStore.getQuery(api.nodes.queries.listByWorkspace, { workspaceId });
      if (currentNodes === undefined) return;

      localStore.setQuery(
        api.nodes.queries.listByWorkspace,
        { workspaceId },
        currentNodes.map((n) => 
          n._id === args.nodeId 
            ? { ...n, index: args.newIndex, updatedAt: Date.now() } 
            : n
        )
      );
    }
  );

  // === HELPER: Mapa memoizado para O(1) clientId -> serverId lookups ===
  const clientIdToServerIdMap = useMemo(() => {
    const map = new Map<string, Id<"nodes">>();
    convexNodes?.forEach(node => {
      // Adiciona apenas nodes que já sincronizaram (com _id real, não temp_)
      // E que possuem clientId (nodes antigos podem não ter)
      const nodeClientId = node.clientId ?? node._id.toString();
      if (!node._id.toString().startsWith('temp_')) {
        map.set(nodeClientId, node._id);
      }
    });
    return map;
  }, [convexNodes]);

  const findServerIdByClientId = useCallback(
    (clientId: string): Id<"nodes"> | null => {
      return clientIdToServerIdMap.get(clientId) ?? null;
    },
    [clientIdToServerIdMap]
  );

  // === FUNÇÕES EXPOSTAS ===

  // Cria node - gera UUID e cor no cliente para optimistic update instantâneo
  const createNode = useCallback(
    async (type: "note" | "table" | "checklist" | "image" = "note", imageUrl?: string) => {
      if (!workspaceId) return null;
      
      // Gera UUID único no cliente (padrão Notion/Figma/Linear)
      const clientId = crypto.randomUUID();
      // Pre-gera cor para evitar flicker (cliente e servidor escolheriam cores diferentes)
      const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
      
      return await createNodeMutation({ clientId, workspaceId, type, color, imageUrl });
    },
    [workspaceId, createNodeMutation]
  );

  // Atualiza node com debounce reduzido (50ms) - optimistic update dá feedback imediato
  const updateNode = useCallback(
    (clientId: string, updates: Partial<{
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      title: string;
      titleAlign: "left" | "center" | "right";
      icon: string;
      content: unknown;
    }>) => {
      // Encontra o _serverId pelo clientId
      const serverId = findServerIdByClientId(clientId);
      if (!serverId) return; // Node ainda não existe no servidor
      
      // Cancela timeout anterior se existir
      const existingTimeout = updateTimeoutRef.current.get(clientId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Debounce curto (50ms) - o optimistic update já atualiza o cache imediatamente
      const timeout = setTimeout(async () => {
        try {
          await updateNodeMutation({
            nodeId: serverId,
            x: updates.x,
            y: updates.y,
            width: updates.width,
            height: updates.height,
            color: updates.color,
            title: updates.title,
            titleAlign: updates.titleAlign,
            icon: updates.icon,
            content: updates.content,
          });
        } catch (error) {
          console.error("Erro ao salvar node:", error);
        }
        updateTimeoutRef.current.delete(clientId);
      }, 50);

      updateTimeoutRef.current.set(clientId, timeout);
    },
    [findServerIdByClientId, updateNodeMutation]
  );

  // Atualiza node imediatamente (sem debounce) - usa optimistic update para cor/título
  const updateNodeImmediate = useCallback(
    async (clientId: string, updates: Partial<{
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      title: string;
      titleAlign: "left" | "center" | "right";
      icon: string;
      content: unknown;
    }>) => {
      // Encontra o _serverId pelo clientId
      const serverId = findServerIdByClientId(clientId);
      if (!serverId) return; // Node ainda não existe no servidor
      
      // Cancela qualquer debounce pendente
      const existingTimeout = updateTimeoutRef.current.get(clientId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        updateTimeoutRef.current.delete(clientId);
      }

      // updateNodeMutation já tem optimistic update para todos os campos
      await updateNodeMutation({
        nodeId: serverId,
        x: updates.x,
        y: updates.y,
        width: updates.width,
        height: updates.height,
        color: updates.color,
        title: updates.title,
        titleAlign: updates.titleAlign,
        icon: updates.icon,
        content: updates.content,
      });
    },
    [findServerIdByClientId, updateNodeMutation]
  );

  // Deleta um node
  const deleteNode = useCallback(
    async (clientId: string) => {
      // Encontra o _serverId pelo clientId
      const serverId = findServerIdByClientId(clientId);
      if (!serverId) return; // Node ainda não existe no servidor (não pode deletar)
      
      // Cancela qualquer update pendente
      const timeout = updateTimeoutRef.current.get(clientId);
      if (timeout) {
        clearTimeout(timeout);
        updateTimeoutRef.current.delete(clientId);
      }

      await deleteNodeMutation({ nodeId: serverId });
    },
    [findServerIdByClientId, deleteNodeMutation]
  );

  // Deleta múltiplos nodes de uma vez
  const deleteNodes = useCallback(
    async (clientIds: string[]) => {
      // Mapeia clientIds para serverIds, filtrando nodes que ainda não existem no servidor
      const serverIds = clientIds
        .map(findServerIdByClientId)
        .filter((id): id is Id<"nodes"> => id !== null);
      
      if (serverIds.length === 0) return;

      // Cancela updates pendentes para todos os nodes
      clientIds.forEach((clientId) => {
        const timeout = updateTimeoutRef.current.get(clientId);
        if (timeout) {
          clearTimeout(timeout);
          updateTimeoutRef.current.delete(clientId);
        }
      });

      await deleteManyMutation({ nodeIds: serverIds });
    },
    [findServerIdByClientId, deleteManyMutation]
  );

  // Duplica node
  const duplicateNode = useCallback(
    async (clientId: string) => {
      // Encontra o _serverId pelo clientId
      const serverId = findServerIdByClientId(clientId);
      if (!serverId) return null; // Node ainda não existe no servidor
      
      // Gera novo UUID para o node duplicado
      const newClientId = crypto.randomUUID();
      
      return await duplicateNodeMutation({ 
        nodeId: serverId, 
        clientId: newClientId 
      });
    },
    [findServerIdByClientId, duplicateNodeMutation]
  );

  // Atualiza múltiplos nodes (para movimento em grupo)
  const updateNodes = useCallback(
    async (updates: Array<{ id: string; x?: number; y?: number; width?: number; height?: number }>) => {
      if (updates.length === 0) return;

      // Mapeia clientIds para serverIds
      const serverUpdates = updates
        .map(u => {
          const serverId = findServerIdByClientId(u.id);
          if (!serverId) return null;
          return {
            nodeId: serverId,
            x: u.x,
            y: u.y,
            width: u.width,
            height: u.height,
          };
        })
        .filter((u): u is NonNullable<typeof u> => u !== null);

      if (serverUpdates.length === 0) return;

      // Cancela updates pendentes para todos os nodes
      updates.forEach(({ id }) => {
        const timeout = updateTimeoutRef.current.get(id);
        if (timeout) {
          clearTimeout(timeout);
          updateTimeoutRef.current.delete(id);
        }
      });

      await updateManyMutation({ updates: serverUpdates });
    },
    [findServerIdByClientId, updateManyMutation]
  );

  // Reordena (z-index)
  const reorderNode = useCallback(
    async (clientId: string, newIndex: string) => {
      // Encontra o _serverId pelo clientId
      const serverId = findServerIdByClientId(clientId);
      if (!serverId) return; // Node ainda não existe no servidor
      
      await reorderNodeMutation({
        nodeId: serverId,
        newIndex,
      });
    },
    [findServerIdByClientId, reorderNodeMutation]
  );

  // Converte formato Convex para formato CanvasNode (compatibilidade)
  // Usa clientId como id (identificador principal no frontend)
  // Fallback para _id se clientId não existir (nodes antigos antes da migração)
  const nodes = useMemo(() => 
    convexNodes?.map((node) => ({
      id: node.clientId ?? node._id.toString(), // Fallback para nodes existentes sem clientId
      _serverId: node._id as string, // Mantém referência ao _id para mutations
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      color: node.color,
      index: node.index,
      title: node.title,
      titleAlign: node.titleAlign,
      icon: node.icon,
      type: node.type,
      content: node.content,
    })) ?? [],
    [convexNodes]
  );

  return {
    nodes,
    isLoading: convexNodes === undefined,
    createNode,
    updateNode,
    updateNodeImmediate,
    deleteNode,
    deleteNodes,
    duplicateNode,
    updateNodes,
    reorderNode,
  };
}
