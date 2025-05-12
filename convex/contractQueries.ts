import { query, internalQuery } from "./_generated/server";
import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";

// Query zum Auflisten der Verträge für den aktuellen Benutzer
export const listContracts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Sollte nicht passieren, wenn Authentifizierung konfiguriert ist,
      // aber zur Sicherheit eine leere Liste zurückgeben oder Fehler werfen.
      // Werfen wir einen Fehler, da der Benutzer angemeldet sein sollte, um das Dashboard zu sehen.
      throw new ConvexError("Benutzer nicht authentifiziert.");
    }

    // Verträge für den aktuellen Benutzer abrufen
    // TODO: Später ggf. Paginierung hinzufügen, falls die Liste sehr lang wird.
    const contracts = await ctx.db
      .query("contracts")
      // Annahme: Das Schema hat ein Feld wie `ownerId` oder `userId`, das die Clerk-ID speichert.
      // Wir verwenden `identity.subject`, was die eindeutige ID des authentifizierten Benutzers ist.
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      // Sortieren nach Upload-Datum (oder Erstellungszeit), neueste zuerst
      .order("desc") 
      .collect();

    return contracts;
  },
}); 

// Query zum Abrufen eines einzelnen Vertrags anhand seiner ID
export const getContractById = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      throw new ConvexError("Contract not found.");
    }
    return contract;
  },
}); 

// NEU: Interne Query, um alle Verträge für die Migration abzurufen
export const getAllContractsForMigration = internalQuery({
  handler: async (ctx): Promise<Doc<"contracts">[]> => {
    // Ruft alle Dokumente aus der 'contracts'-Tabelle ab.
    // Bei sehr großen Tabellen könnte man hier über Pagination nachdenken,
    // aber für eine einmalige Migration ist dies oft ausreichend.
    const contracts = await ctx.db.query("contracts").collect();
    return contracts;
  },
}); 