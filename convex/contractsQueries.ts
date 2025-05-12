import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel"; // Import Doc

export const getContractById = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args): Promise<Doc<"contracts"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Oder einen Fehler werfen, wenn ein nicht authentifizierter Zugriff explizit fehlschlagen soll
      return null;
    }
    const contract = await ctx.db.get(args.contractId);

    if (!contract) {
      return null;
    }

    // Prüfen, ob der authentifizierte Benutzer der Eigentümer des Vertrags ist
    if (contract.userId !== identity.subject) {
      // Nicht autorisiert, den Vertrag nicht zurückgeben
      return null;
    }

    return contract;
  },
});

export const listUserContracts = query({
    args: {},
    handler: async (ctx): Promise<Doc<"contracts">[]> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return []; 
        }
        const contracts = await ctx.db
            .query("contracts")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .order("desc") 
            .collect();
        return contracts;
    },
}); 

// export const getAllContractsForMigration = internalQuery({
//   handler: async (ctx) => {
//     return await ctx.db.query("contracts").collect();
//   }
// });

/*
export const getAllContractsForMigration = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("contracts").collect();
  }
});
*/ 