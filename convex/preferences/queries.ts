import { query } from "../_generated/server";
import { authComponent } from "../auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return null;
    }
    if (!user) return null;

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return prefs ?? { theme: "system" as const };
  },
});
