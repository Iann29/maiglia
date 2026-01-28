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

// Retorna apenas temas premium desbloqueados pelo usuário
// Não inclui temas default (gratuitos)
// Usa Fast Auth (~0ms) - JWT
export const getUnlockedThemes = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalUserFast(ctx);
    if (!user) return [];

    // Buscar temas desbloqueados pelo usuário
    const userThemes = await ctx.db
      .query("userThemes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    if (userThemes.length === 0) return [];

    // Buscar dados completos de cada tema
    const themesWithData = await Promise.all(
      userThemes.map(async (ut) => {
        const theme = await ctx.db.get(ut.themeId);
        if (!theme || theme.isDefault) return null; // Ignora temas default
        return {
          ...theme,
          unlockedAt: ut.unlockedAt,
        };
      })
    );

    // Filtra nulls e retorna
    return themesWithData.filter((t): t is NonNullable<typeof t> => t !== null);
  },
});

// Retorna o tema ativo do usuário (da userPreferences) ou o tema default
// Usa Fast Auth (~0ms) - JWT
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    // Buscar tema "Default Light" como fallback (usando slug para pegar o correto)
    const defaultTheme = await ctx.db
      .query("themes")
      .withIndex("by_slug", (q) => q.eq("slug", "default-light"))
      .unique();

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
