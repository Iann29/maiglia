import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// NOTA: As tabelas do Better Auth (user, session, account, etc.)
// estão no componente separado "betterAuth" e NÃO devem ser importadas aqui.
// O Better Auth gerencia seu próprio schema via convex/betterAuth/schema.ts

export default defineSchema({
  // Preferências do usuário
  userPreferences: defineTable({
    userId: v.string(),
    activeThemeId: v.optional(v.id("themes")), // Tema ativo (fonte única de verdade, opcional para migração)
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Saldo de créditos do usuário
  credits: defineTable({
    userId: v.string(),
    balance: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Histórico de transações de créditos
  creditTransactions: defineTable({
    userId: v.string(),
    amount: v.number(), // Positivo para ganho, negativo para gasto
    type: v.union(v.literal("earned"), v.literal("spent"), v.literal("purchased")),
    reason: v.string(), // Descrição da transação
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  // Temas disponíveis no sistema
  themes: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    previewUrl: v.optional(v.string()),
    colors: v.object({
      bgPrimary: v.string(),
      bgSecondary: v.string(),
      fgPrimary: v.string(),
      fgSecondary: v.string(),
      accent: v.string(),
      accentHover: v.string(),
      canvasGrid: v.string(), // Cor dos pontos do grid do canvas
      nodeColors: v.array(v.string()), // Cores dos nodes (8 cores)
      workspaceColors: v.array(v.string()), // Cores dos workspaces (8 cores)
    }),
    font: v.string(),
    isDefault: v.boolean(),
    price: v.number(), // Preço em créditos (0 para gratuitos)
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_isDefault", ["isDefault"]),

  // Temas desbloqueados por usuário
  userThemes: defineTable({
    userId: v.string(),
    themeId: v.id("themes"),
    unlockedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_themeId", ["userId", "themeId"]),

  // Workspaces - cada usuário pode ter múltiplos workspaces (abas)
  workspaces: defineTable({
    userId: v.string(),
    name: v.string(),
    color: v.string(),
    index: v.string(), // Fractional indexing para ordenação das abas
    nodeCount: v.optional(v.number()), // Contador pré-calculado de nodes (opcional para backward compat)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_index", ["userId", "index"]),

  // Nodes - blocos dentro dos workspaces
  nodes: defineTable({
    clientId: v.optional(v.string()), // UUID gerado pelo cliente (opcional para backward compat)
    workspaceId: v.id("workspaces"),
    type: v.union(v.literal("note"), v.literal("table"), v.literal("checklist"), v.literal("image")),
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
    color: v.string(),
    index: v.string(), // Fractional indexing para z-order (camadas)
    title: v.string(),
    titleAlign: v.union(v.literal("left"), v.literal("center"), v.literal("right")),
    icon: v.optional(v.string()), // Emoji/ícone do node (ex: "🥬")
    iconPosition: v.optional(v.string()), // "top-left" | "top-center" | ... | "bottom-right"
    iconSize: v.optional(v.string()), // "XS" | "S" | "M" | "L" | "XL"
    iconStyle: v.optional(v.string()), // "normal" | "background" | "border" | "shadow"
    titleSize: v.optional(v.union(
      v.literal("hidden"),
      v.literal("S"),
      v.literal("M"),
      v.literal("L"),
      v.literal("XL")
    )), // Tamanho da fonte do título
    style: v.optional(v.union(
      v.literal(0),
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
      v.literal(6),
      v.literal(7),
      v.literal(8)
    )), // Estilo visual do node (9 estilos: 0-8)
    content: v.optional(v.any()), // Conteúdo específico do tipo (flexível)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_index", ["workspaceId", "index"])
    .index("by_clientId", ["clientId"]),
});
