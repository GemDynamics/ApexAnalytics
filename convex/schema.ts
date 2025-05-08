import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Clerk User ID
    clerkId: v.string(),
    // Weitere benutzerbezogene Felder hier...
    // email: v.string(),
    // name: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  contracts: defineTable({
    ownerId: v.string(), // Clerk User ID des Besitzers
    fileName: v.string(),
    storageId: v.id("_storage"),
    status: v.union(
      v.literal("pending"),      // Hochgeladen, wartet auf Verarbeitung
      v.literal("processing"),   // In Analyse
      v.literal("completed"),    // Analyse erfolgreich abgeschlossen
      v.literal("failed"),        // Analyse fehlgeschlagen
      v.literal("chunking")      // Spezieller Status für die Chunk-Verarbeitung (optional)
    ),
    uploadedAt: v.number(), // Timestamp
    analysisProtocol: v.optional(
      v.array(
        v.object({
          chunkNumber: v.optional(v.number()), // Um die Reihenfolge bei Bedarf sicherzustellen
          clauseText: v.string(),
          evaluation: v.string(), // Rot, Gelb, Grün
          reason: v.string(),
          recommendation: v.string(),
        })
      )
    ),
    // Optional: Feld, um die Gesamtzahl der erwarteten Chunks zu speichern
    totalChunks: v.optional(v.number()),
    processedChunks: v.optional(v.number()), // Zähler für verarbeitete Chunks
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_status", ["status"]),

  // Optional: Tabelle für Analysedetails pro Chunk, wenn man es sehr granular möchte
  // analysisChunks: defineTable({
  //   contractId: v.id("contracts"),
  //   chunkNumber: v.number(),
  //   chunkText: v.string(), // Nur für Debugging, sollte nicht zu groß sein
  //   status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
  //   result: v.optional(v.array(v.object({ /* Struktur wie oben in analysisProtocol */ }))),
  // }).index("by_contractId_and_chunkNumber", ["contractId", "chunkNumber"])
}); 