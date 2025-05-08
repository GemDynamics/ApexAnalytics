import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel"; // Import Doc

export const getContractById = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args): Promise<Doc<"contracts"> | null> => {
    return await ctx.db.get(args.contractId);
  },
});

export const listUserContracts = query({
    args: {},
    handler: async (ctx): Promise<Doc<"contracts">[]> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return []; 
        }
        return await ctx.db
            .query("contracts")
            .withIndex("by_ownerId", (q) => q.eq("ownerId", identity.subject))
            .order("desc") 
            .collect();
    },
}); 