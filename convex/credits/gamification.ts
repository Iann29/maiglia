import type { MutationCtx } from "../_generated/server";

/**
 * Adiciona créditos a um usuário diretamente (sem autenticação, uso interno).
 * Cria registro de créditos se não existir e registra transação.
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
 * Adiciona créditos com limite diário por categoria.
 * Verifica quantos créditos foram ganhos hoje para a categoria e só adiciona
 * se não ultrapassar o limite.
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

  // Buscar transações de hoje para esta categoria
  const todayTransactions = await ctx.db
    .query("creditTransactions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  const todayEarned = todayTransactions
    .filter(
      (t) =>
        t.createdAt >= todayStartMs &&
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
