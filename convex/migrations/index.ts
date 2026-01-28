/**
 * Registro de Migrações do Maiglia
 *
 * Usa o componente oficial @convex-dev/migrations para migrações
 * seguras de dados em produção com:
 * - Paginação automática para datasets grandes
 * - Tracking de progresso (resumable)
 * - Dry-run para preview
 *
 * ORDEM RECOMENDADA DE EXECUÇÃO:
 * 1. welcomeBonusFromWorkspaces → welcomeBonusFromPreferences
 * 2. unlockDefaultThemesFromWorkspaces → unlockDefaultThemesFromPreferences
 * 3. backfillNodeCount
 *
 * COMANDOS CLI:
 * - Executar específica: npx convex run migrations/index:run '{"fn": "migrations/index:welcomeBonusFromWorkspaces"}'
 * - Preview (dry-run): npx convex run migrations/index:run '{"fn": "migrations/index:backfillNodeCount", "dryRun": true}'
 * - Executar todas: npx convex run migrations/index:runAll
 */

import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "../_generated/api";
import { DataModel } from "../_generated/dataModel";

export const migrations = new Migrations<DataModel>(components.migrations);

// Runner genérico para executar migrações individualmente via CLI
export const run = migrations.runner();

// ============================================================
// MIGRAÇÕES DISPONÍVEIS
// ============================================================

/**
 * Migração 1a: Welcome Bonus (via Workspaces)
 * Adiciona 50 créditos para usuários que ainda não possuem registro de créditos.
 * Itera sobre workspaces para encontrar userIds.
 *
 * Executar: npx convex run migrations/index:run '{"fn": "migrations/index:welcomeBonusFromWorkspaces"}'
 */
export const welcomeBonusFromWorkspaces = migrations.define({
  table: "workspaces",
  migrateOne: async (ctx, workspace) => {
    const userId = workspace.userId;

    // Verificar se já existe registro de créditos para este usuário
    const existingCredits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    // Se já existe, não faz nada (idempotente)
    if (existingCredits) {
      return;
    }

    const now = Date.now();

    // Criar registro de créditos com saldo inicial de 50
    await ctx.db.insert("credits", {
      userId,
      balance: 50,
      updatedAt: now,
    });

    // Registrar transação de bônus de boas-vindas
    await ctx.db.insert("creditTransactions", {
      userId,
      amount: 50,
      type: "earned",
      reason: "Bônus de boas-vindas (migração)",
      createdAt: now,
    });
  },
});

/**
 * Migração 1b: Welcome Bonus (via UserPreferences)
 * Cobre usuários que possuem preferências mas não possuem workspaces.
 *
 * Executar: npx convex run migrations/index:run '{"fn": "migrations/index:welcomeBonusFromPreferences"}'
 */
export const welcomeBonusFromPreferences = migrations.define({
  table: "userPreferences",
  migrateOne: async (ctx, prefs) => {
    const userId = prefs.userId;

    // Verificar se já existe registro de créditos para este usuário
    const existingCredits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    // Se já existe, não faz nada (idempotente)
    if (existingCredits) {
      return;
    }

    const now = Date.now();

    // Criar registro de créditos com saldo inicial de 50
    await ctx.db.insert("credits", {
      userId,
      balance: 50,
      updatedAt: now,
    });

    // Registrar transação de bônus de boas-vindas
    await ctx.db.insert("creditTransactions", {
      userId,
      amount: 50,
      type: "earned",
      reason: "Bônus de boas-vindas (migração)",
      createdAt: now,
    });
  },
});

/**
 * Migração 2a: Unlock Default Themes (via Workspaces)
 * Desbloqueia temas default (isDefault: true) para todos os usuários.
 * Itera sobre workspaces para encontrar userIds.
 *
 * NOTA: Processa mesmo usuário múltiplas vezes se tiver vários workspaces,
 * mas é idempotente (verifica antes de inserir).
 *
 * Executar: npx convex run migrations/index:run '{"fn": "migrations/index:unlockDefaultThemesFromWorkspaces"}'
 */
export const unlockDefaultThemesFromWorkspaces = migrations.define({
  table: "workspaces",
  migrateOne: async (ctx, workspace) => {
    const userId = workspace.userId;

    // Buscar todos os temas default
    const defaultThemes = await ctx.db
      .query("themes")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .collect();

    const now = Date.now();

    // Para cada tema default, verificar se já está desbloqueado
    for (const theme of defaultThemes) {
      const existingUnlock = await ctx.db
        .query("userThemes")
        .withIndex("by_userId_themeId", (q) =>
          q.eq("userId", userId).eq("themeId", theme._id)
        )
        .unique();

      // Se já desbloqueado, pula (idempotente)
      if (existingUnlock) {
        continue;
      }

      // Desbloquear tema para o usuário
      await ctx.db.insert("userThemes", {
        userId,
        themeId: theme._id,
        unlockedAt: now,
      });
    }
  },
});

/**
 * Migração 2b: Unlock Default Themes (via UserPreferences)
 * Cobre usuários que possuem preferências mas não possuem workspaces.
 *
 * Executar: npx convex run migrations/index:run '{"fn": "migrations/index:unlockDefaultThemesFromPreferences"}'
 */
export const unlockDefaultThemesFromPreferences = migrations.define({
  table: "userPreferences",
  migrateOne: async (ctx, prefs) => {
    const userId = prefs.userId;

    // Buscar todos os temas default
    const defaultThemes = await ctx.db
      .query("themes")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .collect();

    const now = Date.now();

    // Para cada tema default, verificar se já está desbloqueado
    for (const theme of defaultThemes) {
      const existingUnlock = await ctx.db
        .query("userThemes")
        .withIndex("by_userId_themeId", (q) =>
          q.eq("userId", userId).eq("themeId", theme._id)
        )
        .unique();

      // Se já desbloqueado, pula (idempotente)
      if (existingUnlock) {
        continue;
      }

      // Desbloquear tema para o usuário
      await ctx.db.insert("userThemes", {
        userId,
        themeId: theme._id,
        unlockedAt: now,
      });
    }
  },
});

/**
 * Migração 3: Backfill Node Count
 * Preenche o campo nodeCount em workspaces que ainda não possuem o valor.
 * Conta os nodes de cada workspace e atualiza o campo.
 *
 * Executar: npx convex run migrations/index:run '{"fn": "migrations/index:backfillNodeCount"}'
 */
export const backfillNodeCount = migrations.define({
  table: "workspaces",
  migrateOne: async (ctx, workspace) => {
    // Se já tem nodeCount definido, não faz nada (idempotente)
    if (workspace.nodeCount !== undefined) {
      return;
    }

    // Contar nodes do workspace usando collect (ok para workspaces típicos <1000 nodes)
    // Para workspaces muito grandes, considere usar paginação manual
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    // Retorna patch (shorthand syntax do migrations framework)
    return { nodeCount: nodes.length };
  },
});

/**
 * Migração 4: Limpar campo "theme" legado
 * Remove o campo "theme" das preferências de usuários, já que o sistema
 * foi unificado para usar apenas activeThemeId.
 *
 * NOTA: Esta migração não faz nada pois Convex ignora campos extras.
 * O campo será removido naturalmente quando o documento for atualizado.
 *
 * Executar: npx convex run migrations/index:runConvertSystemTheme
 */
export const convertSystemThemeToLight = migrations.define({
  table: "userPreferences",
  migrateOne: async () => {
    // Não faz nada - campo "theme" será ignorado pelo novo schema
    // e removido quando o documento for atualizado (e.g. ao trocar tema)
    return;
  },
});

// ============================================================
// RUNNERS PARA EXECUÇÃO VIA CLI
// ============================================================

/**
 * Executa todas as migrações em ordem.
 * Comando: npx convex run migrations/index:runAll
 */
export const runAll = migrations.runner([
  internal.migrations.index.welcomeBonusFromWorkspaces,
  internal.migrations.index.welcomeBonusFromPreferences,
  internal.migrations.index.unlockDefaultThemesFromWorkspaces,
  internal.migrations.index.unlockDefaultThemesFromPreferences,
  internal.migrations.index.backfillNodeCount,
]);

// Runners individuais para conveniência
export const runWelcomeBonusWorkspaces = migrations.runner(
  internal.migrations.index.welcomeBonusFromWorkspaces
);
export const runWelcomeBonusPreferences = migrations.runner(
  internal.migrations.index.welcomeBonusFromPreferences
);
export const runUnlockThemesWorkspaces = migrations.runner(
  internal.migrations.index.unlockDefaultThemesFromWorkspaces
);
export const runUnlockThemesPreferences = migrations.runner(
  internal.migrations.index.unlockDefaultThemesFromPreferences
);
export const runBackfillNodeCount = migrations.runner(
  internal.migrations.index.backfillNodeCount
);
export const runConvertSystemTheme = migrations.runner(
  internal.migrations.index.convertSystemThemeToLight
);
