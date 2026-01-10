import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Lista todos os workspaces do usuário autenticado
 * Ordenados pelo index (fractional indexing)
 */
export const list = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Ordena pelo index (fractional indexing)
    return workspaces.sort((a, b) => a.index.localeCompare(b.index));
  },
});

/**
 * Busca um workspace específico pelo ID
 */
export const get = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workspaceId);
  },
});

/**
 * Busca o primeiro workspace do usuário (para redirecionamento inicial)
 */
export const getFirst = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (workspaces.length === 0) return null;

    // Retorna o primeiro por index
    const sorted = workspaces.sort((a, b) => a.index.localeCompare(b.index));
    return sorted[0];
  },
});
