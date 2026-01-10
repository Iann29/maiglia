import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Cores padrão para nodes (mesmas do canvas-types.ts)
const NODE_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
];

// Dimensões padrão (mesmas do canvas-types.ts)
const DEFAULT_NODE_WIDTH = 160;
const DEFAULT_NODE_HEIGHT = 120;
const GRID_SIZE = 40;
const CANVAS_PADDING = 40;

/**
 * Cria um novo node em um workspace
 */
export const create = mutation({
  args: {
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
    // Busca nodes existentes para calcular posição e index
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

    // Calcula posição se não fornecida (encontra espaço livre)
    let x = args.x ?? CANVAS_PADDING;
    let y = args.y ?? CANVAS_PADDING;

    if (args.x === undefined || args.y === undefined) {
      // Tenta encontrar posição livre
      const position = findFreePosition(existingNodes);
      x = position.x;
      y = position.y;
    }

    // Cor aleatória se não fornecida
    const color =
      args.color ?? NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];

    const now = Date.now();
    const nodeId = await ctx.db.insert("nodes", {
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
    const { nodeId, ...updates } = args;

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
    await ctx.db.patch(args.nodeId, {
      index: args.newIndex,
      updatedAt: Date.now(),
    });
    return args.nodeId;
  },
});

/**
 * Duplica um node existente
 */
export const duplicate = mutation({
  args: {
    nodeId: v.id("nodes"),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.nodeId);
    if (!original) throw new Error("Node não encontrado");

    // Busca nodes para calcular próximo index
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
    await ctx.db.delete(args.nodeId);
    return args.nodeId;
  },
});

/**
 * Função auxiliar para encontrar posição livre no canvas
 */
function findFreePosition(
  nodes: Array<{ x: number; y: number; width: number; height: number }>
): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: CANVAS_PADDING, y: CANVAS_PADDING };
  }

  const maxY = Math.max(...nodes.map((n) => n.y + n.height)) + GRID_SIZE;

  for (let y = CANVAS_PADDING; y <= maxY; y += GRID_SIZE) {
    for (let x = CANVAS_PADDING; x <= 1200; x += GRID_SIZE) {
      const overlaps = nodes.some((node) => {
        const nodeRight = node.x + node.width;
        const nodeBottom = node.y + node.height;
        const testRight = x + DEFAULT_NODE_WIDTH;
        const testBottom = y + DEFAULT_NODE_HEIGHT;

        return (
          x < nodeRight &&
          testRight > node.x &&
          y < nodeBottom &&
          testBottom > node.y
        );
      });

      if (!overlaps) {
        return { x, y };
      }
    }
  }

  return { x: CANVAS_PADDING, y: maxY + GRID_SIZE };
}
