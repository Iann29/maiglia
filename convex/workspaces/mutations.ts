import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { addCreditsInternal } from "../credits/gamification";
import { rateLimiter } from "../rateLimits";

// Cores padrão para workspaces
const WORKSPACE_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#ef4444", // red
];

/**
 * Cria um novo workspace para o usuário
 * Se for o primeiro, usa index "a", senão gera após o último
 */
export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limit: proteção anti-abuse
    await rateLimiter.limit(ctx, "createWorkspace", { key: args.userId });

    // Busca workspaces existentes para determinar o próximo index
    const existingWorkspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Gera index: "a" se primeiro, ou após o último existente
    let newIndex = "a";
    if (existingWorkspaces.length > 0) {
      const sorted = existingWorkspaces.sort((a, b) =>
        a.index.localeCompare(b.index)
      );
      const lastIndex = sorted[sorted.length - 1].index;
      // Simples incremento de caractere (para produção usar fractional-indexing)
      newIndex = lastIndex + "a";
    }

    // Cor aleatória se não fornecida
    const color =
      args.color ??
      WORKSPACE_COLORS[existingWorkspaces.length % WORKSPACE_COLORS.length];

    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      userId: args.userId,
      name: args.name,
      color,
      index: newIndex,
      nodeCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Gamificação: +5 créditos ao criar primeiro workspace
    if (existingWorkspaces.length === 0) {
      await addCreditsInternal(ctx, args.userId, 5, "Primeiro workspace criado");
    }

    return workspaceId;
  },
});

/**
 * Atualiza um workspace (nome, cor)
 */
export const update = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { workspaceId, ...updates } = args;

    // Remove campos undefined
    const cleanUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.color !== undefined) cleanUpdates.color = updates.color;

    await ctx.db.patch(workspaceId, cleanUpdates);
    return workspaceId;
  },
});

/**
 * Atualiza o index de um workspace (para reordenação)
 */
export const reorder = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    newIndex: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workspaceId, {
      index: args.newIndex,
      updatedAt: Date.now(),
    });
    return args.workspaceId;
  },
});

/**
 * Deleta um workspace e todos os seus nodes
 */
export const remove = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    // Busca workspace para rate limit
    const workspace = await ctx.db.get(args.workspaceId);
    if (workspace) {
      await rateLimiter.limit(ctx, "removeWorkspace", { key: workspace.userId });
    }

    // Primeiro, deleta todos os nodes do workspace
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    for (const node of nodes) {
      await ctx.db.delete(node._id);
    }

    // Depois, deleta o workspace
    await ctx.db.delete(args.workspaceId);
    return args.workspaceId;
  },
});
