import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { tables as authTables } from "./betterAuth/generatedSchema";

export default defineSchema({
  ...authTables,

  userPreferences: defineTable({
    userId: v.string(),
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
});
