import { paginationOptsValidator } from "convex/server";
import { query } from "../_generated/server";
import { getOptionalUserFast } from "../lib/auth";

// Retorna o saldo atual de créditos do usuário autenticado (default: 0)
// Usa Fast Auth (~0ms) - JWT
export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalUserFast(ctx);
    if (!user) return { balance: 0 };

    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return { balance: credits?.balance ?? 0 };
  },
});

// Retorna o histórico de transações de créditos do usuário com paginação (ordenado por createdAt desc)
// Usa Fast Auth (~0ms) - JWT
export const getTransactions = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await getOptionalUserFast(ctx);
    if (!user) return { page: [], isDone: true, continueCursor: "" };

    return await ctx.db
      .query("creditTransactions")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
