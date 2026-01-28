import { query } from "../_generated/server";
import { authComponent } from "../auth";

// Retorna o usuário atual autenticado (dados completos do banco)
// Usa Full Auth (~800ms) - necessário para retornar todos os campos do usuário
// Lança exceção se não autenticado
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
