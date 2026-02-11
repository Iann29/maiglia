import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { requireAuth, requireAuthFast } from "./lib/auth";
import { rateLimiter } from "./rateLimits";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    await rateLimiter.limit(ctx, "uploadFile", { key: user.userId ?? user._id });
    return await ctx.runMutation(
      components.convexFilesControl.upload.generateUploadUrl,
      { provider: "convex" }
    );
  },
});

export const finalizeUpload = mutation({
  args: {
    uploadToken: v.string(),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const userId = user.userId ?? user._id;
    await rateLimiter.limit(ctx, "uploadFile", { key: userId });
    const result = await ctx.runMutation(
      components.convexFilesControl.upload.finalizeUpload,
      {
        uploadToken: args.uploadToken,
        storageId: args.storageId,
        accessKeys: [userId],
      }
    );
    const url = await ctx.storage.getUrl(args.storageId);
    return { ...result, url };
  },
});

export const getStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    await requireAuthFast(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
