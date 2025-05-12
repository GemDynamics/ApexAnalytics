import { internalAction, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";

// Funktion zur Durchführung einer Vektor-Ähnlichkeitssuche (jetzt als internalAction)
export const findSimilarKnowledgeChunks = internalAction({
    args: {
        embedding: v.array(v.float64()), // Der Vektor, nach dem gesucht wird
        limit: v.number(),              // Maximale Anzahl der zurückzugebenden Ergebnisse
    },
    // Rückgabetyp ist jetzt wieder die Liste der vollständigen Dokumente
    handler: async (ctx: ActionCtx, args): Promise<Doc<"knowledgeChunks">[]> => { 
        console.log(`Performing vector search for ${args.limit} chunks using internalAction...`);
        try {
            // 1. Vektorsuche durchführen (liefert Objekte mit _id und _score)
            const searchResults = await ctx.vectorSearch(
                "knowledgeChunks", // Table name
                "embedding",       // Index name
                {
                    vector: args.embedding,
                    limit: args.limit,
                }
            );

            console.log(`Found ${searchResults.length} potential matches via vector search.`);

            // 2. IDs extrahieren
            const resultIds = searchResults.map(result => result._id);

            // 3. Vollständige Dokumente anhand der IDs abrufen
            // Verwende Promise.all, um die Abrufe parallel auszuführen
            const results = await Promise.all(
                resultIds.map(id => ctx.runQuery(api.knowledgeQueries.getKnowledgeChunkById, { chunkId: id }))
            );
            
            // Filtere null-Werte heraus, falls ein Dokument nicht gefunden wurde
            const validResults = results.filter((doc): doc is Doc<"knowledgeChunks"> => doc !== null);

            console.log(`Retrieved ${validResults.length} full knowledge chunks.`);
            return validResults;

        } catch (error: any) {
            console.error("Error during vector search or document retrieval in action:", error);
            throw new Error(`Vector search failed: ${error.message || 'Unknown error'}`);
        }
    },
});

// Hilfs-Query zum Abrufen eines einzelnen Chunks per ID (wird oben benötigt)
export const getKnowledgeChunkById = query({
    args: { chunkId: v.id("knowledgeChunks") },
    handler: async (ctx, args): Promise<Doc<"knowledgeChunks"> | null> => {
        return await ctx.db.get(args.chunkId);
    },
}); 