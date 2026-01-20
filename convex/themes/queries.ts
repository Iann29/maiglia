import { query } from "../_generated/server";
import { authComponent } from "../auth";

// Lista todos os temas com flag `isUnlocked` baseado em userThemes do usuário
// Temas default (isDefault: true) são sempre desbloqueados para todos
export const list = query({
  args: {},
  handler: async (ctx) => {
    // Buscar todos os temas
    const themes = await ctx.db.query("themes").collect();

    // Tentar obter usuário autenticado
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      user = null;
    }

    // Se não autenticado, apenas temas default são desbloqueados
    if (!user) {
      return themes.map((theme) => ({
        ...theme,
        isUnlocked: theme.isDefault,
      }));
    }

    // Buscar temas desbloqueados pelo usuário
    const userThemes = await ctx.db
      .query("userThemes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const unlockedThemeIds = new Set(userThemes.map((ut) => ut.themeId));

    // Retornar temas com flag isUnlocked
    return themes.map((theme) => ({
      ...theme,
      isUnlocked: theme.isDefault || unlockedThemeIds.has(theme._id),
    }));
  },
});

// Retorna o tema ativo do usuário (da userPreferences) ou o tema default
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    // Buscar tema default como fallback
    const defaultTheme = await ctx.db
      .query("themes")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    // Tentar obter usuário autenticado
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return defaultTheme ?? null;
    }

    if (!user) return defaultTheme ?? null;

    // Buscar preferências do usuário
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    // Se não tem tema ativo definido, retornar default
    if (!prefs?.activeThemeId) {
      return defaultTheme ?? null;
    }

    // Buscar o tema ativo
    const activeTheme = await ctx.db.get(prefs.activeThemeId);

    // Se tema não existe mais, retornar default
    if (!activeTheme) {
      return defaultTheme ?? null;
    }

    return activeTheme;
  },
});
