/**
 * ⚠️ DEBUG ONLY - REMOVER ANTES DE PRODUÇÃO ⚠️
 *
 * Funções de debug para desenvolvimento.
 * Esta pasta inteira (_debug) deve ser removida antes do deploy em produção.
 *
 * Uso via Dashboard do Convex ou CLI:
 * - Preview: npx convex run _debug/purgeUser:listUserData '{"userId": "..."}'
 * - Purge:   npx convex run _debug/purgeUser:purge '{"userId": "..."}'
 * - Listar:  npx convex run _debug/purgeUser:listAllUsers
 *
 * NOTA: Dados de autenticação (Better Auth) devem ser removidos manualmente
 * via dashboard do Convex ou API do Better Auth.
 */

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

// ============================================================
// LISTA DADOS DO USUÁRIO (Preview antes de deletar)
// ============================================================

/**
 * Lista todos os dados de um usuário sem deletar nada.
 * Útil para preview antes de executar o purge.
 */
export const listUserData = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Buscar workspaces do usuário
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Buscar nodes de todos os workspaces
    let totalNodes = 0;
    for (const workspace of workspaces) {
      const nodes = await ctx.db
        .query("nodes")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
        .collect();
      totalNodes += nodes.length;
    }

    // Buscar outros dados do usuário
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const creditTransactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const userThemes = await ctx.db
      .query("userThemes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const userPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return {
      userId,
      counts: {
        workspaces: workspaces.length,
        nodes: totalNodes,
        credits: credits.length,
        creditTransactions: creditTransactions.length,
        userThemes: userThemes.length,
        userPreferences: userPreferences.length,
      },
      total:
        workspaces.length +
        totalNodes +
        credits.length +
        creditTransactions.length +
        userThemes.length +
        userPreferences.length,
    };
  },
});

// ============================================================
// PURGE COMPLETO DO USUÁRIO
// ============================================================

/**
 * Remove TODOS os dados de um usuário de forma segura.
 * Deleta em ordem correta para respeitar dependências.
 *
 * @param userId - ID do usuário a ser removido
 * @param includeAuthData - Se true, também remove dados do Better Auth (user, session, account)
 *
 * ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!
 */
export const purge = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const deleted = {
      nodes: 0,
      workspaces: 0,
      creditTransactions: 0,
      credits: 0,
      userThemes: 0,
      userPreferences: 0,
    };

    // 1. Buscar workspaces do usuário
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // 2. Deletar nodes de cada workspace
    for (const workspace of workspaces) {
      const nodes = await ctx.db
        .query("nodes")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
        .collect();

      for (const node of nodes) {
        await ctx.db.delete(node._id);
        deleted.nodes++;
      }
    }

    // 3. Deletar workspaces
    for (const workspace of workspaces) {
      await ctx.db.delete(workspace._id);
      deleted.workspaces++;
    }

    // 4. Deletar histórico de transações de créditos
    const creditTransactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const transaction of creditTransactions) {
      await ctx.db.delete(transaction._id);
      deleted.creditTransactions++;
    }

    // 5. Deletar saldo de créditos
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const credit of credits) {
      await ctx.db.delete(credit._id);
      deleted.credits++;
    }

    // 6. Deletar temas desbloqueados
    const userThemes = await ctx.db
      .query("userThemes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const userTheme of userThemes) {
      await ctx.db.delete(userTheme._id);
      deleted.userThemes++;
    }

    // 7. Deletar preferências do usuário
    const userPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const pref of userPreferences) {
      await ctx.db.delete(pref._id);
      deleted.userPreferences++;
    }

    // NOTA: Dados de autenticação (Better Auth: user, session, account)
    // devem ser removidos manualmente via dashboard do Convex.

    const totalDeleted = Object.values(deleted).reduce((a, b) => a + b, 0);

    return {
      success: true,
      userId,
      deleted,
      totalDeleted,
      message: `Removidos ${totalDeleted} documentos do usuário ${userId}`,
    };
  },
});

// ============================================================
// FUNÇÕES AUXILIARES DE DEBUG
// ============================================================

/**
 * Lista todos os usuários únicos no sistema (baseado em workspaces).
 * Útil para encontrar userIds para teste.
 */
export const listAllUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    const userIds = [...new Set(workspaces.map((w) => w.userId))];

    const users = [];
    for (const userId of userIds) {
      const workspaceCount = workspaces.filter((w) => w.userId === userId).length;
      users.push({ userId, workspaceCount });
    }

    return {
      totalUsers: users.length,
      users,
    };
  },
});
