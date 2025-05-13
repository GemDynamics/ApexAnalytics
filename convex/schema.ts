import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Definition für den Typ ContractStatus, basierend auf den Fehlern
// Du könntest dies spezifischer machen, z.B. v.union(v.literal("processing"), v.literal("completed"), ...)
const contractStatus = v.union(
  v.literal("pending"),
  v.literal("uploading"),
  v.literal("uploaded"),
  v.literal("preprocessing_structure"), // Wird für Textextraktion noch verwendet
  v.literal("processing"), // Generischer Status, bleibt vorerst
  // NEU: Status für Stufe 1
  v.literal("stage1_chunking_inprogress"),
  v.literal("stage1_chunking_completed"),
  v.literal("stage1_chunking_failed"),
  // NEU: Status für Stufe 2
  v.literal("stage2_structuring_inprogress"),
  v.literal("stage2_structuring_completed"), // Wenn alle Chunks strukturiert sind
  v.literal("stage2_structuring_failed"), // Wenn Strukturierung eines Chunks fehlschlägt
  // NEU: Status für Stufe 3
  v.literal("stage3_analysis_inprogress"),
  // Bestehende End-/Fehlerstatus anpassen/beibehalten
  v.literal("completed"), // Erfolgreicher Abschluss aller Stufen
  v.literal("failed"), // Genereller Fehler (z.B. Upload) oder kritischer Fehler in Stufe 1/2
  v.literal("failed_partial_analysis"), // Beibehalten für Fehler in Stufe 3
  v.literal("archived"),
  // Fehlender Status aus altem Schema
  v.literal("analysis_inprogress"), // Wird in alten Verträgen noch verwendet
  v.literal("chunking"), // Wird in alten Verträgen möglicherweise noch verwendet
  v.literal("structured_json_generated") // Wird in alten Verträgen möglicherweise noch verwendet
); 

// Definition für analysisProtocol Elemente, basierend auf den Fehlern - ENTFERNT, da Analyseergebnisse in structuredContractElements
// const analysisProtocolEntry = v.object({ ... });

export default defineSchema({
  // Tabelle für Wissens-Chunks mit Vektor-Einbettungen
  knowledgeChunks: defineTable({
    // id: v.string(), // Entfernt, _id von Convex wird als Primärschlüssel verwendet
    textContent: v.string(),
    metadata: v.object({
      source: v.string(),
      type: v.string(),
      keywords: v.array(v.string()),
      last_updated: v.string()
    }),
    // Vektor-Einbettung für die Ähnlichkeitssuche
    embedding: v.array(v.float64())
  }).vectorIndex("embedding", { // Beibehaltung des Indexnamens "embedding"
    dimensions: 768, // Dimension für das Gemini text-embedding-004 Modell (wie ursprünglich)
    vectorField: "embedding" // Feld, das die Vektoren enthält
  }),

  // Tabelle für Vertragsanalyse-Regeln
  analysisRules: defineTable({
    type: v.string(), // "red_flag", "yellow_flag", or "green_pattern"
    chunkIds: v.array(v.string()), // IDs der zugehörigen Wissens-Chunks // TODO: Bezieht sich dies auf Convex _id oder alte string ID?
  }),

  // Tabelle für verarbeitete Verträge
  contracts: defineTable({
    title: v.optional(v.string()),
    originalText: v.optional(v.string()), // Wird evtl. durch fullMarkdownText abgelöst oder ergänzt
    fileName: v.optional(v.string()),
    userId: v.optional(v.string()),
    storageId: v.optional(v.string()), // Sollte v.id("_storage") sein, wenn es direkt eine Convex Storage ID ist
    
    // NEU: Strukturierter Inhalt und Metadaten aus Stufe 1 (und/oder Upload)
    fullMarkdownText: v.optional(v.string()), // Vollständiger Text nach initialer Konvertierung/Bereinigung

    // NEU: Feld für große Chunks aus Stufe 1
    largeChunks: v.optional(v.array(v.object({
        chunkNumber: v.number(),
        identifiedSections: v.array(v.string()), // Enthält nummerierte/benannte Hauptabschnitte
        chunkContent: v.string()
    }))),

    // Angepasst: Detaillierte Struktur aus Stufe 2
    structuredContractElements: v.optional(v.array(
      v.object({
        elementType: v.string(),
        elementId: v.string(),
        markdownContent: v.string(),
        originalOrderInChunk: v.number(), // Reihenfolge innerhalb des Stage-2-JSON-Outputs
        globalChunkNumber: v.number(), // Nummer des großen Chunks aus Stage 1 (NEU)
        globalOriginalOrder: v.number(), // Globale Reihenfolge im gesamten Dokument (Bleibt relevant)
        // Felder für Analyseergebnisse aus Stufe 3 (optional, da sie später hinzugefügt werden)
        evaluation: v.optional(v.string()),
        reason: v.optional(v.string()),
        recommendation: v.optional(v.string()),
        isError: v.optional(v.boolean()),
        errorMessage: v.optional(v.string()),
      })
    )),
    
    // Veraltet? Ggf. entfernen, falls komplett durch structuredContractElements ersetzt
    structuredElements: v.optional(v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        content: v.string(),
        level: v.optional(v.number()),
        parentId: v.optional(v.string())
      })
    )),
    createdAt: v.optional(v.number()),
    uploadedAt: v.optional(v.number()),
    lastEditedAt: v.optional(v.number()),

    // Status und Fortschritt
    status: v.optional(contractStatus),
    // NEU: Fortschrittsfelder für die neuen Stufen
    totalLargeChunks: v.optional(v.number()),
    structuredLargeChunks: v.optional(v.number()), // Anzahl erfolgreich strukturierter großer Chunks (Stufe 2)
    totalElementsToAnalyze: v.optional(v.number()), // Gesamtzahl der Elemente aus Stufe 2
    analyzedElements: v.optional(v.number()), // Anzahl erfolgreich analysierter Elemente (Stufe 3)

    // Bestehende Felder für Details/Fehler
    currentProcessingStepDetail: v.optional(v.string()), // Kann weiterhin genutzt werden für feinere Statusanzeige
    errorDetails: v.optional(v.string()),

    // Feld für von Benutzern bearbeitete Analysen/Klauseln
    editedAnalysis: v.optional(v.any()),

  })
  // Index für Abfragen nach Benutzer-ID
  .index("by_userId", ["userId"]),

  // Tabelle für die Klauselanalyse - Überprüfen, ob noch benötigt oder durch structuredContractElements abgedeckt
  clauseAnalyses: defineTable({
    contractId: v.id("contracts"),
    clauseId: v.string(), // Bezieht sich auf die ID im structuredElements Array
    analysis: v.object({
      status: v.string(), // "red", "yellow", "green"
      relevantChunks: v.array(v.string()), // IDs der relevanten Wissens-Chunks // TODO: Bezieht sich dies auf Convex _id oder alte string ID?
      explanation: v.string(),
      alternativeSuggestions: v.optional(v.array(v.string())),
    }),
    createdAt: v.number()
  })
}, {
  schemaValidation: true, // Schema-Validierung wieder aktiviert nach erfolgreicher Migration
}); 