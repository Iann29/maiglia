import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

// Adiciona créditos ao usuário (uso interno, gamificação)
// Cria registro de créditos se não existir e registra transação
export const add = mutation({
  args: {
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, { amount, reason }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Não autenticado");

    if (amount <= 0) throw new Error("Quantidade deve ser positiva");

    const existing = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        balance: existing.balance + amount,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("credits", {
        userId: user._id,
        balance: amount,
        updatedAt: now,
      });
    }

    // Registrar transação
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      amount,
      type: "earned",
      reason,
      createdAt: now,
    });

    return { success: true, newBalance: (existing?.balance ?? 0) + amount };
  },
});

// Gasta créditos do usuário com validação de saldo suficiente
export const spend = mutation({
  args: {
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, { amount, reason }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Não autenticado");

    if (amount <= 0) throw new Error("Quantidade deve ser positiva");

    const existing = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const currentBalance = existing?.balance ?? 0;

    if (currentBalance < amount) {
      throw new Error(`Saldo insuficiente. Você tem ${currentBalance} créditos, mas precisa de ${amount}.`);
    }

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        balance: currentBalance - amount,
        updatedAt: now,
      });
    }

    // Registrar transação (amount negativo para gastos)
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      amount: -amount,
      type: "spent",
      reason,
      createdAt: now,
    });

    return { success: true, newBalance: currentBalance - amount };
  },
});

// Internal mutation para adicionar créditos (usado por outras mutations internas)
export const addInternal = internalMutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, { userId, amount, reason }) => {
    if (amount <= 0) throw new Error("Quantidade deve ser positiva");

    const existing = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        balance: existing.balance + amount,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("credits", {
        userId,
        balance: amount,
        updatedAt: now,
      });
    }

    // Registrar transação
    await ctx.db.insert("creditTransactions", {
      userId,
      amount,
      type: "earned",
      reason,
      createdAt: now,
    });

    return { success: true, newBalance: (existing?.balance ?? 0) + amount };
  },
});
