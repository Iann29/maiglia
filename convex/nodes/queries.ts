import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Lista todos os nodes de um workspace específico
 * Ordenados pelo index (fractional indexing para z-order)
 */
export const listByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Ordena pelo index (z-order: primeiro = atrás, último = frente)
    return nodes.sort((a, b) => a.index.localeCompare(b.index));
  },
});

/**
 * Busca um node específico pelo ID
 */
export const get = query({
  args: {
    nodeId: v.id("nodes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.nodeId);
  },
});

/**
 * Conta quantos nodes existem em um workspace
 */
export const countByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return nodes.length;
  },
});
