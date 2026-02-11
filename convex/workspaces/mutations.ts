import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { rateLimiter } from "../rateLimits";
import { requireAuth } from "../lib/auth";
import { getWorkspaceColorByIndex } from "../lib/constants";

/**
 * Cria um novo workspace para o usuário
 *
 * Se parentId não for fornecido, cria um workspace pai (categoria)
 * e automaticamente cria um sub-workspace "Geral" dentro dele.
 *
 * Se parentId for fornecido, cria um sub-workspace (página) dentro do pai.
 */
export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    color: v.optional(v.string()),
    parentId: v.optional(v.id("workspaces")),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (args.userId !== user._id) throw new Error("Não autorizado");

    await rateLimiter.limit(ctx, "createWorkspace", { key: user._id });

    let siblings;
    let parentColor: string | undefined;

    if (args.parentId) {
      // Criando sub-workspace: valida o pai e busca irmãos
      const parent = await ctx.db.get(args.parentId);
      if (!parent) throw new Error("Workspace pai não encontrado");
      if (parent.userId !== user._id) throw new Error("Não autorizado");
      parentColor = parent.color;

      siblings = await ctx.db
        .query("workspaces")
        .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId!))
        .collect();
    } else {
      // Criando workspace pai: busca outros pais
      const allWorkspaces = await ctx.db
        .query("workspaces")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
      siblings = allWorkspaces.filter((w) => !w.parentId);
    }

    // Gera index após o último irmão
    let newIndex = "a";
    if (siblings.length > 0) {
      const sorted = siblings.sort((a, b) => a.index.localeCompare(b.index));
      newIndex = sorted[sorted.length - 1].index + "a";
    }

    // Cor: explícita > herdada do pai > baseada no índice
    const color = args.color ?? parentColor ?? getWorkspaceColorByIndex(siblings.length);

    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      userId: args.userId,
      name: args.name,
      color,
      index: newIndex,
      parentId: args.parentId,
      emoji: args.emoji,
      nodeCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Se criou um pai, cria automaticamente o sub-workspace "Geral"
    if (!args.parentId) {
      await ctx.db.insert("workspaces", {
        userId: args.userId,
        name: "Geral",
        color,
        index: "a",
        parentId: workspaceId,
        nodeCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return workspaceId;
  },
});

/**
 * Atualiza um workspace (nome, cor, emoji)
 */
export const update = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace não encontrado");
    if (workspace.userId !== user._id) throw new Error("Não autorizado");

    const { workspaceId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.color !== undefined) cleanUpdates.color = updates.color;
    if (updates.emoji !== undefined) cleanUpdates.emoji = updates.emoji;

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
    const user = await requireAuth(ctx);

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
 * Deleta um workspace
 *
 * Se for pai: cascade-deleta todos os filhos e seus nodes.
 * Não permite deletar o último workspace pai do usuário.
 *
 * Se for filho: deleta o sub-workspace e seus nodes.
 * Não permite deletar o último sub-workspace de um pai.
 */
export const remove = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace não encontrado");
    if (workspace.userId !== user._id) throw new Error("Não autorizado");

    await rateLimiter.limit(ctx, "removeWorkspace", { key: user._id });

    if (!workspace.parentId) {
      // Deletando pai: verifica se é o último
      const allWorkspaces = await ctx.db
        .query("workspaces")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      const parentCount = allWorkspaces.filter((w) => !w.parentId).length;
      if (parentCount <= 1) {
        throw new Error("Não é possível deletar o último workspace");
      }

      // Cascade: deleta todos os filhos e seus nodes
      const children = await ctx.db
        .query("workspaces")
        .withIndex("by_parentId", (q) => q.eq("parentId", args.workspaceId))
        .collect();

      for (const child of children) {
        const childNodes = await ctx.db
          .query("nodes")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", child._id))
          .collect();
        await Promise.all(childNodes.map((n) => ctx.db.delete(n._id)));
        await ctx.db.delete(child._id);
      }

      // Deleta nodes do próprio pai (se houver)
      const parentNodes = await ctx.db
        .query("nodes")
        .withIndex("by_workspaceId", (q) =>
          q.eq("workspaceId", args.workspaceId)
        )
        .collect();
      await Promise.all(parentNodes.map((n) => ctx.db.delete(n._id)));

      await ctx.db.delete(args.workspaceId);
    } else {
      // Deletando filho: verifica se é o último do pai
      const siblings = await ctx.db
        .query("workspaces")
        .withIndex("by_parentId", (q) => q.eq("parentId", workspace.parentId!))
        .collect();
      if (siblings.length <= 1) {
        throw new Error("Não é possível deletar o último sub-workspace");
      }

      // Deleta nodes do sub-workspace
      const nodes = await ctx.db
        .query("nodes")
        .withIndex("by_workspaceId", (q) =>
          q.eq("workspaceId", args.workspaceId)
        )
        .collect();
      await Promise.all(nodes.map((n) => ctx.db.delete(n._id)));

      await ctx.db.delete(args.workspaceId);
    }

    return args.workspaceId;
  },
});
