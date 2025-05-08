import { query } from "./_generated/server";
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
    if (contract.ownerId !== identity.subject) {
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
        return await ctx.db
            .query("contracts")
            .withIndex("by_ownerId", (q) => q.eq("ownerId", identity.subject))
            .order("desc") 
            .collect();
    },
}); 