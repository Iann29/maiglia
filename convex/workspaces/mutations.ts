import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { rateLimiter } from "../rateLimits";
import { requireAuth } from "../lib/auth";
import { getWorkspaceColorByIndex } from "../lib/constants";

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
    // Verifica autenticação e que o usuário está criando para si mesmo
    const user = await requireAuth(ctx);
    if (args.userId !== user._id) throw new Error("Não autorizado");

    // Rate limit: proteção anti-abuse (usa userId autenticado)
    await rateLimiter.limit(ctx, "createWorkspace", { key: user._id });

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

    // Cor baseada no índice se não fornecida
    const color = args.color ?? getWorkspaceColorByIndex(existingWorkspaces.length);

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
    // Verifica autenticação
    const user = await requireAuth(ctx);

    // Busca workspace e verifica ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace não encontrado");
    if (workspace.userId !== user._id) throw new Error("Não autorizado");

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
    // Verifica autenticação
    const user = await requireAuth(ctx);

    // Busca workspace e verifica ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace não encontrado");
    if (workspace.userId !== user._id) throw new Error("Não autorizado");

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
    // Verifica autenticação
    const user = await requireAuth(ctx);

    // Busca workspace e verifica ownership
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace não encontrado");
    if (workspace.userId !== user._id) throw new Error("Não autorizado");

    // Rate limit: proteção anti-abuse (usa userId autenticado)
    await rateLimiter.limit(ctx, "removeWorkspace", { key: user._id });

    // Deleta todos os nodes do workspace em paralelo
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    await Promise.all(nodes.map((node) => ctx.db.delete(node._id)));

    // Depois, deleta o workspace
    await ctx.db.delete(args.workspaceId);
    return args.workspaceId;
  },
});
