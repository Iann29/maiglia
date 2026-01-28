/**
 * ⚠️ DEBUG ONLY - REMOVER ANTES DE PRODUÇÃO ⚠️
 *
 * Funções de debug para o componente Better Auth.
 * Este arquivo deve ser removido antes do deploy em produção.
 */

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Remove todos os dados de autenticação de um usuário.
 * Deleta: sessions, accounts, user
 *
 * @param userId - ID do usuário (da tabela user do Better Auth)
 */
export const purgeAuthData = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const deleted = {
      sessions: 0,
      accounts: 0,
      users: 0,
    };

    // 1. Deletar todas as sessões do usuário
    const sessions = await ctx.db
      .query("session")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
      deleted.sessions++;
    }

    // 2. Deletar todas as contas (providers) do usuário
    const accounts = await ctx.db
      .query("account")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    for (const account of accounts) {
      await ctx.db.delete(account._id);
      deleted.accounts++;
    }

    // 3. Deletar o usuário
    // O userId no Better Auth é o _id da tabela user
    const user = await ctx.db.get(userId as any);
    if (user) {
      await ctx.db.delete(user._id);
      deleted.users++;
    }

    return {
      success: true,
      userId,
      deleted,
      totalDeleted: deleted.sessions + deleted.accounts + deleted.users,
    };
  },
});

/**
 * Lista dados de autenticação de um usuário (preview).
 */
export const listAuthData = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const sessions = await ctx.db
      .query("session")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const accounts = await ctx.db
      .query("account")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const user = await ctx.db.get(userId as any);

    return {
      userId,
      user: user ? { id: user._id, email: (user as any).email, name: (user as any).name } : null,
      counts: {
        sessions: sessions.length,
        accounts: accounts.length,
        user: user ? 1 : 0,
      },
    };
  },
});
