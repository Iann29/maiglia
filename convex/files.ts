import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { requireAuth } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
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
    const result = await ctx.runMutation(
      components.convexFilesControl.upload.finalizeUpload,
      {
        uploadToken: args.uploadToken,
        storageId: args.storageId,
        accessKeys: [user.userId],
      }
    );
    return result;
  },
});

export const getStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
