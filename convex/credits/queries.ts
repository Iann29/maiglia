import { query } from "../_generated/server";
import { authComponent } from "../auth";

// Retorna o saldo atual de créditos do usuário autenticado (default: 0)
export const get = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return { balance: 0 };
    }
    if (!user) return { balance: 0 };

    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return { balance: credits?.balance ?? 0 };
  },
});

// Retorna o histórico de transações de créditos do usuário (ordenado por createdAt desc)
export const getTransactions = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return [];
    }
    if (!user) return [];

    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // Ordenar por createdAt desc
    return transactions.sort((a, b) => b.createdAt - a.createdAt);
  },
});
