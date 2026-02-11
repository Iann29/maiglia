import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAuth } from "../lib/auth";

/**
 * Categorias fixas do Maiglia
 *
 * Duplicado de src/constants/workspaces.ts porque o Convex
 * não pode importar arquivos de src/
 */
const FIXED_CATEGORIES = [
  {
    name: "Casa",
    emoji: "🏠",
    color: "#22c55e",
    subPages: ["Lista do Mercado", "Rotina de Limpeza", "Compras e Afazeres"],
  },
  {
    name: "Finanças",
    emoji: "💰",
    color: "#f97316",
    subPages: [
      "Meu Financeiro",
      "Logins e Senhas",
      "Metas Financeiras",
      "Itens de Desejo",
      "Viagem - Custos",
    ],
  },
  {
    name: "Estudos",
    emoji: "📚",
    color: "#3b82f6",
    subPages: ["Estudos", "Caderno", "Livros"],
  },
  {
    name: "Saúde",
    emoji: "💪",
    color: "#ec4899",
    subPages: ["Medidas", "Planilhas de Treino", "Dieta", "Saúde", "Beleza"],
  },
  {
    name: "Vida",
    emoji: "🌟",
    color: "#8b5cf6",
    subPages: [
      "Sobre Mim",
      "Minhas Metas",
      "Minha Semana",
      "Meu Mês",
      "Minha Agenda",
    ],
  },
];

/**
 * Seed dos workspaces fixos para novos usuários
 *
 * Idempotente: se o usuário já tiver qualquer workspace, não faz nada.
 * Cria as 5 categorias com todas as sub-páginas de uma vez.
 */
export const seedFixedWorkspaces = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (args.userId !== user._id) throw new Error("Não autorizado");

    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) return;

    const now = Date.now();

    for (let i = 0; i < FIXED_CATEGORIES.length; i++) {
      const cat = FIXED_CATEGORIES[i];
      const parentIndex = String.fromCharCode(97 + i); // "a", "b", "c", "d", "e"

      const parentId = await ctx.db.insert("workspaces", {
        userId: args.userId,
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        index: parentIndex,
        nodeCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      for (let j = 0; j < cat.subPages.length; j++) {
        const subIndex = String.fromCharCode(97 + j); // "a", "b", "c", ...
        await ctx.db.insert("workspaces", {
          userId: args.userId,
          name: cat.subPages[j],
          color: cat.color,
          index: subIndex,
          parentId,
          nodeCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});
