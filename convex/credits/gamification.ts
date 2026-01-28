import type { MutationCtx } from "../_generated/server";

/**
 * Adiciona créditos a um usuário diretamente (sem autenticação, uso interno).
 * Cria registro de créditos se não existir e registra transação.
 *
 * NOTA: Limites diários agora são controlados via Rate Limiter (@convex-dev/rate-limiter)
 * em convex/rateLimits.ts. Esta função apenas adiciona os créditos.
 */
export async function addCreditsInternal(
  ctx: MutationCtx,
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  const existing = await ctx.db
    .query("credits")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  const now = Date.now();

  if (existing) {
    await ctx.db.patch(existing._id, {
      balance: existing.balance + amount,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("credits", {
      userId,
      balance: amount,
      updatedAt: now,
    });
  }

  await ctx.db.insert("creditTransactions", {
    userId,
    amount,
    type: "earned",
    reason,
    createdAt: now,
  });
}

/**
 * @deprecated Use rateLimiter.limit() do convex/rateLimits.ts para controle de limites diários.
 * Esta função foi substituída pelo Rate Limiter oficial do Convex que é transacional e type-safe.
 *
 * Exemplo de uso novo:
 * ```ts
 * import { rateLimiter } from "../rateLimits";
 *
 * const limitResult = await rateLimiter.limit(ctx, "nodeCreationCredits", {
 *   key: userId,
 *   throws: false,
 * });
 *
 * if (limitResult.ok) {
 *   await addCreditsInternal(ctx, userId, 2, "Criação de bloco [node_creation]");
 * }
 * ```
 */
export async function addCreditsWithDailyLimit(
  ctx: MutationCtx,
  userId: string,
  amount: number,
  dailyLimit: number,
  category: string,
  reasonDisplay: string
): Promise<boolean> {
  // Calcular início do dia atual (UTC)
  const now = Date.now();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  // Buscar apenas transações de hoje usando range query (evita carregar histórico completo)
  const todayTransactions = await ctx.db
    .query("creditTransactions")
    .withIndex("by_userId_createdAt", (q) =>
      q.eq("userId", userId).gte("createdAt", todayStartMs)
    )
    .collect();

  const todayEarned = todayTransactions
    .filter(
      (t) =>
        t.type === "earned" &&
        t.reason.includes(category)
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Verificar se ultrapassou o limite diário
  if (todayEarned >= dailyLimit) {
    return false;
  }

  // Calcular quanto pode ganhar (não ultrapassar limite)
  const remainingToday = dailyLimit - todayEarned;
  const actualAmount = Math.min(amount, remainingToday);

  if (actualAmount <= 0) {
    return false;
  }

  await addCreditsInternal(ctx, userId, actualAmount, `${reasonDisplay} [${category}]`);
  return true;
}
