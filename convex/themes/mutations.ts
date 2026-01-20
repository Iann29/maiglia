import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

// Desbloqueia um tema gastando créditos
export const unlock = mutation({
  args: {
    themeId: v.id("themes"),
  },
  handler: async (ctx, { themeId }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Não autenticado");

    // Buscar o tema
    const theme = await ctx.db.get(themeId);
    if (!theme) throw new Error("Tema não encontrado");

    // Se é tema default, já está desbloqueado
    if (theme.isDefault) {
      throw new Error("Este tema já é gratuito e está desbloqueado");
    }

    // Verificar se já está desbloqueado
    const existingUnlock = await ctx.db
      .query("userThemes")
      .withIndex("by_userId_themeId", (q) =>
        q.eq("userId", user._id).eq("themeId", themeId)
      )
      .unique();

    if (existingUnlock) {
      throw new Error("Você já desbloqueou este tema");
    }

    // Verificar saldo de créditos
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const currentBalance = credits?.balance ?? 0;

    if (currentBalance < theme.price) {
      throw new Error(
        `Saldo insuficiente. Você tem ${currentBalance} créditos, mas precisa de ${theme.price}.`
      );
    }

    const now = Date.now();

    // Gastar créditos
    if (credits) {
      await ctx.db.patch(credits._id, {
        balance: currentBalance - theme.price,
        updatedAt: now,
      });
    }

    // Registrar transação de créditos
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      amount: -theme.price,
      type: "spent",
      reason: `Desbloqueio do tema "${theme.name}"`,
      createdAt: now,
    });

    // Registrar desbloqueio do tema
    await ctx.db.insert("userThemes", {
      userId: user._id,
      themeId,
      unlockedAt: now,
    });

    return { success: true, newBalance: currentBalance - theme.price };
  },
});

// Define o tema ativo do usuário (valida se está desbloqueado ou é default)
export const setActive = mutation({
  args: {
    themeId: v.id("themes"),
  },
  handler: async (ctx, { themeId }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Não autenticado");

    // Buscar o tema
    const theme = await ctx.db.get(themeId);
    if (!theme) throw new Error("Tema não encontrado");

    // Verificar se está desbloqueado (default ou comprado)
    if (!theme.isDefault) {
      const userTheme = await ctx.db
        .query("userThemes")
        .withIndex("by_userId_themeId", (q) =>
          q.eq("userId", user._id).eq("themeId", themeId)
        )
        .unique();

      if (!userTheme) {
        throw new Error("Você precisa desbloquear este tema antes de ativá-lo");
      }
    }

    // Buscar ou criar preferências
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();

    if (prefs) {
      await ctx.db.patch(prefs._id, {
        activeThemeId: themeId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: user._id,
        theme: "system",
        activeThemeId: themeId,
        updatedAt: now,
      });
    }

    return { success: true, theme };
  },
});
