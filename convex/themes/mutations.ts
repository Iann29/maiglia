import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";
import { rateLimiter } from "../rateLimits";

// Dados dos 6 temas iniciais
const INITIAL_THEMES = [
  {
    name: "Default Light",
    slug: "default-light",
    description:
      "O tema claro padrão do Maiglia. Limpo e confortável para uso diário.",
    colors: {
      bgPrimary: "#ffffff",
      bgSecondary: "#f9fafb",
      fgPrimary: "#111827",
      fgSecondary: "#4b5563",
      accent: "#2563eb",
      accentHover: "#1d4ed8",
      canvasGrid: "#d4d4d4",
      nodeColors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"],
    },
    font: "Geist Sans",
    isDefault: true,
    price: 0,
  },
  {
    name: "Default Dark",
    slug: "default-dark",
    description:
      "O tema escuro padrão do Maiglia. Ideal para trabalhar à noite.",
    colors: {
      bgPrimary: "#0a0a0a",
      bgSecondary: "#111111",
      fgPrimary: "#f9fafb",
      fgSecondary: "#9ca3af",
      accent: "#3b82f6",
      accentHover: "#2563eb",
      canvasGrid: "#333333",
      nodeColors: ["#f87171", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6"],
    },
    font: "Geist Sans",
    isDefault: true,
    price: 0,
  },
  {
    name: "Ocean",
    slug: "ocean",
    description:
      "Tema inspirado no oceano com tons de azul e ciano. Calmo e refrescante.",
    colors: {
      bgPrimary: "#0c1929",
      bgSecondary: "#0f2942",
      fgPrimary: "#e2f1ff",
      fgSecondary: "#8ec5fc",
      accent: "#00d9ff",
      accentHover: "#00b8d9",
      canvasGrid: "#1e3a5f",
      nodeColors: ["#0ea5e9", "#06b6d4", "#14b8a6", "#22d3ee", "#38bdf8", "#67e8f9", "#0891b2", "#0d9488"],
    },
    font: "Outfit",
    isDefault: false,
    price: 50,
  },
  {
    name: "Forest",
    slug: "forest",
    description:
      "Tema inspirado na natureza com tons de verde e terra. Sereno e acolhedor.",
    colors: {
      bgPrimary: "#1a2f23",
      bgSecondary: "#243d2e",
      fgPrimary: "#e8f5e9",
      fgSecondary: "#a5d6a7",
      accent: "#4caf50",
      accentHover: "#388e3c",
      canvasGrid: "#2d4a37",
      nodeColors: ["#22c55e", "#16a34a", "#84cc16", "#65a30d", "#4ade80", "#a3e635", "#15803d", "#166534"],
    },
    font: "Nunito",
    isDefault: false,
    price: 50,
  },
  {
    name: "Sunset",
    slug: "sunset",
    description:
      "Tema vibrante com tons de laranja e rosa. Energético e inspirador.",
    colors: {
      bgPrimary: "#2d1f2f",
      bgSecondary: "#3d2a40",
      fgPrimary: "#fff3e8",
      fgSecondary: "#ffb88c",
      accent: "#ff6b6b",
      accentHover: "#ee5a5a",
      canvasGrid: "#4a3545",
      nodeColors: ["#f43f5e", "#fb7185", "#f97316", "#fb923c", "#fbbf24", "#f472b6", "#ec4899", "#e11d48"],
    },
    font: "Quicksand",
    isDefault: false,
    price: 75,
  },
  {
    name: "Midnight",
    slug: "midnight",
    description:
      "Tema sofisticado com tons de roxo e índigo. Elegante e misterioso.",
    colors: {
      bgPrimary: "#1a1a2e",
      bgSecondary: "#25254a",
      fgPrimary: "#eef2ff",
      fgSecondary: "#a5b4fc",
      accent: "#8b5cf6",
      accentHover: "#7c3aed",
      canvasGrid: "#363663",
      nodeColors: ["#8b5cf6", "#a78bfa", "#c084fc", "#818cf8", "#6366f1", "#a855f7", "#7c3aed", "#6d28d9"],
    },
    font: "Poppins",
    isDefault: false,
    price: 75,
  },
];

// Mutation interna para seed dos temas (executável via dashboard ou script)
export const seedThemes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results = [];

    for (const themeData of INITIAL_THEMES) {
      // Verificar se já existe pelo slug
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_slug", (q) => q.eq("slug", themeData.slug))
        .unique();

      if (existing) {
        results.push({ slug: themeData.slug, status: "already_exists" });
        continue;
      }

      // Criar o tema
      await ctx.db.insert("themes", {
        ...themeData,
        createdAt: Date.now(),
      });

      results.push({ slug: themeData.slug, status: "created" });
    }

    return { success: true, results };
  },
});

// Mutation pública para seed (pode ser chamada por admin autenticado)
export const seedInitialThemes = mutation({
  args: {},
  handler: async (ctx) => {
    // Nota: Em produção, adicionar verificação de admin
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Não autenticado");

    const results = [];

    for (const themeData of INITIAL_THEMES) {
      // Verificar se já existe pelo slug
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_slug", (q) => q.eq("slug", themeData.slug))
        .unique();

      if (existing) {
        results.push({ slug: themeData.slug, status: "already_exists" });
        continue;
      }

      // Criar o tema
      await ctx.db.insert("themes", {
        ...themeData,
        createdAt: Date.now(),
      });

      results.push({ slug: themeData.slug, status: "created" });
    }

    return { success: true, results };
  },
});

// Desbloqueia um tema gastando créditos
export const unlock = mutation({
  args: {
    themeId: v.id("themes"),
  },
  handler: async (ctx, { themeId }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Não autenticado");

    // Rate limit: proteção anti-abuse
    await rateLimiter.limit(ctx, "unlockTheme", { key: user._id });

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

    // Rate limit: proteção anti-abuse
    await rateLimiter.limit(ctx, "setActiveTheme", { key: user._id });

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
        activeThemeId: themeId,
        updatedAt: now,
      });
    }

    return { success: true, theme };
  },
});
