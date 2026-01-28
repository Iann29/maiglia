import { query } from "../_generated/server";
import { getOptionalUserFast } from "../lib/auth";

// Lista todos os temas com flag `isUnlocked` baseado em userThemes do usuário
// Temas default (isDefault: true) são sempre desbloqueados para todos
// Usa Fast Auth (~0ms) - JWT
export const list = query({
  args: {},
  handler: async (ctx) => {
    // Buscar todos os temas (tabela controlada com ~6 temas, .collect() aceitável)
    const themes = await ctx.db.query("themes").collect();

    // Obter usuário via JWT (Fast)
    const user = await getOptionalUserFast(ctx);

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
// Usa Fast Auth (~0ms) - JWT
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    // Buscar tema default como fallback (usando index para evitar scan)
    const defaultTheme = await ctx.db
      .query("themes")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();

    // Obter usuário via JWT (Fast)
    const user = await getOptionalUserFast(ctx);
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
