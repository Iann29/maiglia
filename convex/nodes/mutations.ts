import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { rateLimiter } from "../rateLimits";
import { requireAuth } from "../lib/auth";
import {
  NODE_COLORS,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  GRID_SIZE,
  CANVAS_PADDING,
  getRandomNodeColor,
} from "../lib/constants";

/**
 * Cria um novo node em um workspace
 * clientId é gerado pelo cliente (UUID) para permitir optimistic updates instantâneos
 */
export const create = mutation({
  args: {
    clientId: v.string(), // UUID gerado pelo cliente (obrigatório)
    workspaceId: v.id("workspaces"),
    type: v.union(v.literal("note"), v.literal("table"), v.literal("checklist")),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    color: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verifica autenticação
    const user = await requireAuth(ctx);

    // Busca workspace e verifica ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace não encontrado");
    if (workspace.userId !== user._id) throw new Error("Não autorizado");

    // Rate limit: proteção anti-abuse (usa userId autenticado)
    await rateLimiter.limit(ctx, "createNode", { key: user._id });

    // Busca nodes existentes para calcular posição e index
    // NOTA: .collect() aceitável pois escopo é limitado por workspace
    const existingNodes = await ctx.db
      .query("nodes")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Calcula próximo index para z-order
    let newIndex = "a";
    if (existingNodes.length > 0) {
      const sorted = existingNodes.sort((a, b) => a.index.localeCompare(b.index));
      const lastIndex = sorted[sorted.length - 1].index;
      newIndex = lastIndex + "a";
    }

    // Calcula posição se não fornecida
    // Usa algoritmo simples baseado na quantidade de nodes (muito mais rápido que findFreePosition)
    let x = args.x ?? CANVAS_PADDING;
    let y = args.y ?? CANVAS_PADDING;

    if (args.x === undefined && args.y === undefined) {
      // Posição em grid escalonado baseado na quantidade de nodes
      // 5 nodes por linha, depois pula para próxima linha
      const nodeCount = existingNodes.length;
      const col = nodeCount % 5;
      const row = Math.floor(nodeCount / 5);
      x = CANVAS_PADDING + col * (DEFAULT_NODE_WIDTH + GRID_SIZE);
      y = CANVAS_PADDING + row * (DEFAULT_NODE_HEIGHT + GRID_SIZE);
    }

    // Cor aleatória se não fornecida
    const color = args.color ?? getRandomNodeColor();

    const now = Date.now();
    const nodeId = await ctx.db.insert("nodes", {
      clientId: args.clientId, // UUID do cliente para identificação instantânea
      workspaceId: args.workspaceId,
      type: args.type,
      x,
      y,
      width: args.width ?? DEFAULT_NODE_WIDTH,
      height: args.height ?? DEFAULT_NODE_HEIGHT,
      color,
      index: newIndex,
      title: args.title ?? "",
      titleAlign: "center",
      content: undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Atualiza contador pré-calculado
    await ctx.db.patch(args.workspaceId, {
      nodeCount: (workspace.nodeCount ?? 0) + 1,
    });

    return nodeId;
  },
});

/**
 * Atualiza um node (posição, tamanho, cor, título, conteúdo)
 */
export const update = mutation({
  args: {
    nodeId: v.id("nodes"),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    color: v.optional(v.string()),
    title: v.optional(v.string()),
    titleAlign: v.optional(
      v.union(v.literal("left"), v.literal("center"), v.literal("right"))
    ),
    content: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verifica autenticação
    const user = await requireAuth(ctx);

    const { nodeId, ...updates } = args;

    // Busca node e verifica ownership via workspace
    const node = await ctx.db.get(nodeId);
    if (!node) throw new Error("Node não encontrado");

    const workspace = await ctx.db.get(node.workspaceId);
    if (!workspace || workspace.userId !== user._id) {
      throw new Error("Não autorizado");
    }

    // Remove campos undefined e adiciona updatedAt
    const cleanUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });

    await ctx.db.patch(nodeId, cleanUpdates);
    return nodeId;
  },
});

/**
 * Atualiza o index de um node (para reordenação de camadas)
 */
export const reorder = mutation({
  args: {
    nodeId: v.id("nodes"),
    newIndex: v.string(),
  },
  handler: async (ctx, args) => {
    // Verifica autenticação
    const user = await requireAuth(ctx);

    // Busca node e verifica ownership via workspace
    const node = await ctx.db.get(args.nodeId);
    if (!node) throw new Error("Node não encontrado");

    const workspace = await ctx.db.get(node.workspaceId);
    if (!workspace || workspace.userId !== user._id) {
      throw new Error("Não autorizado");
    }

    await ctx.db.patch(args.nodeId, {
      index: args.newIndex,
      updatedAt: Date.now(),
    });
    return args.nodeId;
  },
});

/**
 * Duplica um node existente
 * clientId é gerado pelo cliente para o novo node duplicado
 */
export const duplicate = mutation({
  args: {
    nodeId: v.id("nodes"),
    clientId: v.string(), // UUID para o novo node duplicado
  },
  handler: async (ctx, args) => {
    // Verifica autenticação
    const user = await requireAuth(ctx);

    const original = await ctx.db.get(args.nodeId);
    if (!original) throw new Error("Node não encontrado");

    // Busca workspace e verifica ownership
    const workspace = await ctx.db.get(original.workspaceId);
    if (!workspace) throw new Error("Workspace não encontrado");
    if (workspace.userId !== user._id) throw new Error("Não autorizado");

    // Rate limit: proteção anti-abuse (usa userId autenticado)
    await rateLimiter.limit(ctx, "duplicateNode", { key: user._id });

    // Busca nodes para calcular próximo index
    // NOTA: .collect() aceitável pois escopo é limitado por workspace
    const existingNodes = await ctx.db
      .query("nodes")
      .withIndex("by_workspaceId", (q) =>
        q.eq("workspaceId", original.workspaceId)
      )
      .collect();

    const sorted = existingNodes.sort((a, b) => a.index.localeCompare(b.index));
    const lastIndex = sorted[sorted.length - 1].index;
    const newIndex = lastIndex + "a";

    const now = Date.now();
    const newNodeId = await ctx.db.insert("nodes", {
      clientId: args.clientId, // UUID do cliente para o node duplicado
      workspaceId: original.workspaceId,
      type: original.type,
      x: original.x + GRID_SIZE, // Offset para não sobrepor
      y: original.y + GRID_SIZE,
      width: original.width,
      height: original.height,
      color: original.color,
      index: newIndex,
      title: original.title,
      titleAlign: original.titleAlign,
      content: original.content,
      createdAt: now,
      updatedAt: now,
    });

    // Atualiza contador pré-calculado
    await ctx.db.patch(original.workspaceId, {
      nodeCount: (workspace.nodeCount ?? 0) + 1,
    });

    return newNodeId;
  },
});

/**
 * Deleta um node
 */
export const remove = mutation({
  args: {
    nodeId: v.id("nodes"),
  },
  handler: async (ctx, args) => {
    // Verifica autenticação
    const user = await requireAuth(ctx);

    const node = await ctx.db.get(args.nodeId);
    if (!node) throw new Error("Node não encontrado");

    // Busca workspace e verifica ownership
    const workspace = await ctx.db.get(node.workspaceId);
    if (!workspace) throw new Error("Workspace não encontrado");
    if (workspace.userId !== user._id) throw new Error("Não autorizado");

    // Rate limit: proteção anti-abuse (usa userId autenticado)
    await rateLimiter.limit(ctx, "removeNode", { key: user._id });

    await ctx.db.delete(args.nodeId);

    // Decrementa contador pré-calculado
    await ctx.db.patch(node.workspaceId, {
      nodeCount: Math.max(0, (workspace.nodeCount ?? 0) - 1),
    });

    return args.nodeId;
  },
});

/**
 * Deleta múltiplos nodes de uma vez (batch delete)
 * Usado para deleção em lote quando múltiplos nodes estão selecionados
 */
export const removeMany = mutation({
  args: {
    nodeIds: v.array(v.id("nodes")),
  },
  handler: async (ctx, args) => {
    // Verifica autenticação
    const user = await requireAuth(ctx);
    if (args.nodeIds.length === 0) return [];

    // Rate limit: proteção anti-abuse
    await rateLimiter.limit(ctx, "removeNode", { key: user._id });

    // Mapa para acumular decrementos por workspace
    const workspaceUpdates = new Map<string, { currentCount: number; deletedCount: number }>();

    // Verifica ownership e deleta cada node
    for (const nodeId of args.nodeIds) {
      const node = await ctx.db.get(nodeId);
      if (!node) continue;

      const workspace = await ctx.db.get(node.workspaceId);
      if (!workspace) continue;
      if (workspace.userId !== user._id) {
        throw new Error("Não autorizado");
      }

      await ctx.db.delete(nodeId);

      // Acumula decremento para este workspace
      const wsId = node.workspaceId as string;
      const existing = workspaceUpdates.get(wsId);
      if (existing) {
        existing.deletedCount += 1;
      } else {
        workspaceUpdates.set(wsId, {
          currentCount: workspace.nodeCount ?? 0,
          deletedCount: 1,
        });
      }
    }

    // Atualiza contadores de cada workspace afetado
    for (const [workspaceId, { currentCount, deletedCount }] of workspaceUpdates) {
      await ctx.db.patch(workspaceId as Id<"workspaces">, {
        nodeCount: Math.max(0, currentCount - deletedCount),
      });
    }

    return args.nodeIds;
  },
});

/**
 * Atualiza múltiplos nodes de uma vez (batch update)
 * Usado para movimento em grupo após drag end
 */
export const updateMany = mutation({
  args: {
    updates: v.array(
      v.object({
        nodeId: v.id("nodes"),
        x: v.optional(v.number()),
        y: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verifica autenticação
    const user = await requireAuth(ctx);
    if (args.updates.length === 0) return [];

    const now = Date.now();

    // Processa cada update
    for (const update of args.updates) {
      const node = await ctx.db.get(update.nodeId);
      if (!node) continue;

      const workspace = await ctx.db.get(node.workspaceId);
      if (!workspace || workspace.userId !== user._id) {
        throw new Error("Não autorizado");
      }

      // Monta objeto de update apenas com campos definidos
      const { nodeId, ...fields } = update;
      const cleanFields: Record<string, unknown> = { updatedAt: now };
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) cleanFields[key] = value;
      });

      await ctx.db.patch(nodeId, cleanFields);
    }

    return args.updates.map((u) => u.nodeId);
  },
});

// NOTA: A função findFreePosition foi removida pois era O(n*m) e causava
// lentidão na criação de nodes (~957ms). Substituída por algoritmo simples
// de grid escalonado baseado na quantidade de nodes existentes.
