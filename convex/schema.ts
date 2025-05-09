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
    userId: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    fileName: v.string(),
    storageId: v.id("_storage"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("chunking"), // Neuer Status für das Aufteilen
      v.literal("completed"),
      v.literal("failed")
    ),
    uploadedAt: v.number(),
    analysisProtocol: v.optional(v.array(v.object({
        chunkNumber: v.optional(v.number()),
        clauseText: v.string(),
        evaluation: v.string(), // z.B. "Rot", "Gelb", "Grün", "Fehler"
        reason: v.string(),
        recommendation: v.string(),
    }))),
    totalChunks: v.optional(v.number()),
    processedChunks: v.optional(v.number()),
    error: v.optional(v.string()), // Feld für Fehlermeldungen bei der Analyse
    // NEUE FELDER für bearbeitete Analyse
    editedAnalysis: v.optional(v.array(v.object({
        id: v.string(),
        title: v.string(),
        content: v.string(),
        risk: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("error")),
        evaluation: v.string(),
        reason: v.optional(v.string()),
        recommendation: v.optional(v.string()),
        needsRenegotiation: v.boolean(),
        urgentAttention: v.boolean(),
        removed: v.optional(v.boolean()),
        chunkNumber: v.optional(v.number()),
        alternativeFormulations: v.optional(v.array(v.object({
          id: v.string(),
          content: v.string()
        }))),
    }))),
    lastEditedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_storageId", ["storageId"]),

  // Optional: Tabelle für Analysedetails pro Chunk, wenn man es sehr granular möchte
  // analysisChunks: defineTable({
  //   contractId: v.id("contracts"),
  //   chunkNumber: v.number(),
  //   chunkText: v.string(), // Nur für Debugging, sollte nicht zu groß sein
  //   status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
  //   result: v.optional(v.array(v.object({ /* Struktur wie oben in analysisProtocol */ }))),
  // }).index("by_contractId_and_chunkNumber", ["contractId", "chunkNumber"])
}); 