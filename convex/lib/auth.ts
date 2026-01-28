/**
 * Sistema Dual de Autenticação
 *
 * FAST (JWT ~0ms): Use em QUERIES (leitura)
 * - getOptionalUserFast: retorna null se não autenticado
 * - requireAuthFast: throws se não autenticado
 *
 * FULL (DB ~800ms): Use em MUTATIONS (escrita)
 * - getOptionalUser: retorna null se não autenticado
 * - requireAuth: throws se não autenticado
 *
 * Regra de ouro: Queries → Fast, Mutations → Full
 */

import { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import { DataModel } from "../_generated/dataModel";
import { authComponent } from "../auth";

// Tipo do usuário retornado pelo JWT (Fast)
export interface FastUser {
  _id: string;
  name: string | undefined;
  email: string | undefined;
  emailVerified: boolean;
  sessionId: string | undefined;
}

// Contexto genérico que suporta auth
type AuthCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

/**
 * FAST: Obtém usuário do JWT (~0ms)
 * Retorna null se não autenticado, nunca lança exceção
 * Use em QUERIES
 */
export async function getOptionalUserFast(
  ctx: AuthCtx
): Promise<FastUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return {
    _id: identity.subject,
    name: identity.name,
    email: identity.email,
    emailVerified: identity.emailVerified ?? false,
    sessionId: identity.tokenIdentifier,
  };
}

/**
 * FAST: Exige usuário autenticado (~0ms)
 * Lança exceção se não autenticado
 * Use em QUERIES que requerem autenticação obrigatória
 */
export async function requireAuthFast(ctx: AuthCtx): Promise<FastUser> {
  const user = await getOptionalUserFast(ctx);
  if (!user) {
    throw new Error("Não autenticado");
  }
  return user;
}

/**
 * FULL: Obtém usuário do banco de dados (~800ms)
 * Retorna null se não autenticado, nunca lança exceção
 * Use em MUTATIONS
 */
export async function getOptionalUser(ctx: AuthCtx) {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    return null;
  }
}

/**
 * FULL: Exige usuário autenticado (~800ms)
 * Lança exceção se não autenticado
 * Use em MUTATIONS que requerem autenticação obrigatória
 */
export async function requireAuth(ctx: AuthCtx) {
  const user = await getOptionalUser(ctx);
  if (!user) {
    throw new Error("Não autenticado");
  }
  return user;
}
