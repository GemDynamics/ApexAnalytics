import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel"; // Import Doc
import { ConvexError } from "convex/values";

export const getContractById = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args): Promise<Doc<"contracts"> | null> => {
    try {
      console.log(`Versuche Vertrag mit ID ${args.contractId} zu laden...`);
      
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        console.log(`Zugriff verweigert: Kein authentifizierter Benutzer`);
        // Oder einen Fehler werfen, wenn ein nicht authentifizierter Zugriff explizit fehlschlagen soll
        return null;
      }
      
      const contract = await ctx.db.get(args.contractId);

      if (!contract) {
        console.log(`Vertrag mit ID ${args.contractId} nicht gefunden`);
        // Transparentere Fehlerbehandlung - Ersetzen des null-Rückgabewerts durch einen Fehler
        throw new ConvexError({
          code: "not_found",
          message: `Der Vertrag mit der ID ${args.contractId} konnte nicht gefunden werden.`
        });
      }

      // Prüfen, ob der authentifizierte Benutzer der Eigentümer des Vertrags ist
      if (contract.userId !== identity.subject) {
        console.log(`Zugriff verweigert: Benutzer ${identity.subject} ist nicht Eigentümer des Vertrags ${args.contractId}`);
        // Nicht autorisiert, den Vertrag nicht zurückgeben
        throw new ConvexError({
          code: "unauthorized",
          message: "Sie sind nicht berechtigt, auf diesen Vertrag zuzugreifen."
        });
      }

      console.log(`Vertrag mit ID ${args.contractId} erfolgreich geladen`);
      return contract;
    } catch (error) {
      // Fange unerwartete Fehler ab
      if (error instanceof ConvexError) {
        // Leite bekannte ConvexError-Objekte weiter
        throw error;
      } else {
        // Logge unerwartete Fehler und werfe einen allgemeinen Fehler
        console.error(`Fehler beim Laden des Vertrags: ${error}`);
        throw new ConvexError({
          code: "internal_error",
          message: "Bei der Verarbeitung Ihrer Anfrage ist ein Fehler aufgetreten."
        });
      }
    }
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