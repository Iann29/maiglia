import { query } from "../_generated/server";
import { getOptionalUserFast } from "../lib/auth";

// Retorna preferências do usuário autenticado
// Usa Fast Auth (~0ms) - JWT
export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getOptionalUserFast(ctx);
    if (!user) return null;

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return prefs ?? { theme: "light" as const };
  },
});
