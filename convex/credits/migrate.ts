import { internalMutation, mutation } from "../_generated/server";
import { authComponent } from "../auth";

/**
 * Migração de usuários existentes:
 * - Cria registro de créditos com saldo inicial 50 para cada usuário
 * - Desbloqueia temas default (isDefault: true) para todos
 * - Idempotente: verifica existência antes de criar
 *
 * Pode ser executada via dashboard (internalMutation) ou por admin autenticado
 */
export const migrateUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Buscar todos os userIds distintos via workspaces
    const allWorkspaces = await ctx.db.query("workspaces").collect();
    const userIds = [...new Set(allWorkspaces.map((w) => w.userId))];

    // Buscar também userIds via userPreferences (podem ter prefs sem workspaces)
    const allPrefs = await ctx.db.query("userPreferences").collect();
    const prefsUserIds = allPrefs.map((p) => p.userId);
    const allUserIds = [...new Set([...userIds, ...prefsUserIds])];

    // Buscar temas default
    const allThemes = await ctx.db.query("themes").collect();
    const defaultThemes = allThemes.filter((t) => t.isDefault);

    const results = [];
    const now = Date.now();

    for (const userId of allUserIds) {
      const userResult: {
        userId: string;
        creditsCreated: boolean;
        themesUnlocked: number;
      } = {
        userId,
        creditsCreated: false,
        themesUnlocked: 0,
      };

      // 1. Criar registro de créditos se não existe
      const existingCredits = await ctx.db
        .query("credits")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (!existingCredits) {
        await ctx.db.insert("credits", {
          userId,
          balance: 50,
          updatedAt: now,
        });

        // Registrar transação
        await ctx.db.insert("creditTransactions", {
          userId,
          amount: 50,
          type: "earned",
          reason: "Bônus de boas-vindas (migração)",
          createdAt: now,
        });

        userResult.creditsCreated = true;
      }

      // 2. Desbloquear temas default (criar registros em userThemes)
      for (const theme of defaultThemes) {
        const existingUnlock = await ctx.db
          .query("userThemes")
          .withIndex("by_userId_themeId", (q) =>
            q.eq("userId", userId).eq("themeId", theme._id)
          )
          .unique();

        if (!existingUnlock) {
          await ctx.db.insert("userThemes", {
            userId,
            themeId: theme._id,
            unlockedAt: now,
          });
          userResult.themesUnlocked++;
        }
      }

      results.push(userResult);
    }

    return {
      success: true,
      totalUsers: allUserIds.length,
      results,
    };
  },
});

/**
 * Versão pública da migração (requer autenticação)
 * Para ser chamada por admin via frontend
 */
export const migrateExistingUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Não autenticado");

    // Buscar todos os userIds distintos via workspaces
    const allWorkspaces = await ctx.db.query("workspaces").collect();
    const userIds = [...new Set(allWorkspaces.map((w) => w.userId))];

    // Buscar também userIds via userPreferences
    const allPrefs = await ctx.db.query("userPreferences").collect();
    const prefsUserIds = allPrefs.map((p) => p.userId);
    const allUserIds = [...new Set([...userIds, ...prefsUserIds])];

    // Buscar temas default
    const allThemes = await ctx.db.query("themes").collect();
    const defaultThemes = allThemes.filter((t) => t.isDefault);

    const now = Date.now();
    let creditsCreated = 0;
    let themesUnlocked = 0;

    for (const userId of allUserIds) {
      // 1. Criar registro de créditos se não existe
      const existingCredits = await ctx.db
        .query("credits")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (!existingCredits) {
        await ctx.db.insert("credits", {
          userId,
          balance: 50,
          updatedAt: now,
        });

        await ctx.db.insert("creditTransactions", {
          userId,
          amount: 50,
          type: "earned",
          reason: "Bônus de boas-vindas (migração)",
          createdAt: now,
        });

        creditsCreated++;
      }

      // 2. Desbloquear temas default
      for (const theme of defaultThemes) {
        const existingUnlock = await ctx.db
          .query("userThemes")
          .withIndex("by_userId_themeId", (q) =>
            q.eq("userId", userId).eq("themeId", theme._id)
          )
          .unique();

        if (!existingUnlock) {
          await ctx.db.insert("userThemes", {
            userId,
            themeId: theme._id,
            unlockedAt: now,
          });
          themesUnlocked++;
        }
      }
    }

    return {
      success: true,
      totalUsers: allUserIds.length,
      creditsCreated,
      themesUnlocked,
    };
  },
});
