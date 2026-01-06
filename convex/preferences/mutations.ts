import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

export const updateTheme = mutation({
  args: {
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
  },
  handler: async (ctx, { theme }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Não autenticado");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { theme, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: user._id,
        theme,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
