import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Definition für den Typ ContractStatus, basierend auf den Fehlern
// Du könntest dies spezifischer machen, z.B. v.union(v.literal("processing"), v.literal("completed"), ...)
const contractStatus = v.union(
  v.literal("pending"),
  v.literal("uploading"),
  v.literal("uploaded"),
  v.literal("preprocessing_structure"), // NEU
  v.literal("preprocessing_structure_chunked"), // NEU: Status hinzugefügt, der im Code verwendet wird
  v.literal("structure_generation_inprogress"), // NEU
  v.literal("structure_generation_completed"), // NEU
  v.literal("structured_json_generated"), // NEU: Status hinzugefügt, der in structureContractIncrementallyAndCreateJsonElements verwendet wird
  v.literal("chunking"), // War bereits als String-Möglichkeit in Mutationen
  v.literal("processing"), // War bereits als String-Möglichkeit in Mutationen
  v.literal("analysis_pending"), // NEU für Stufe 3
  v.literal("analysis_inprogress"), // NEU für Stufe 3
  v.literal("completed"),
  v.literal("failed"),
  v.literal("archived") 
); 

// Definition für analysisProtocol Elemente, basierend auf den Fehlern
// Dies ist eine Annahme, passe es an, falls die Struktur anders ist.
const analysisProtocolEntry = v.object({
    chunkNumber: v.optional(v.number()), // scheinbar optional oder später hinzugefügt
    clauseText: v.string(),
    evaluation: v.string(),
    reason: v.string(),
    recommendation: v.string(),
    // ... potenziell weitere Felder
});

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
    
    // NEU: Strukturierter Inhalt und Metadaten aus Stufe 1
    fullMarkdownText: v.optional(v.string()),
    structuredContractElements: v.optional(v.array(
      v.object({
        elementType: v.string(), // z.B. "titleH1", "sectionH2", "clauseH3", "paragraph"
        elementId: v.string(),   // z.B. "# Titel", "## 1. Abschnitt", "### 1.1 Klausel"
        markdownContent: v.string(),
        originalOrderInChunk: v.number(), // Reihenfolge innerhalb des ursprünglichen KI-Antwort-Chunks
        globalOriginalOrder: v.number(),  // Globale Reihenfolge im gesamten Dokument
        // Felder für Analyseergebnisse aus Stufe 3 (optional, da sie später hinzugefügt werden)
        evaluation: v.optional(v.string()), // z.B. "Rot", "Gelb", "Grün", "Info"
        reason: v.optional(v.string()),
        recommendation: v.optional(v.string()),
      })
    )),
    
    // Bestehende Felder für UI-Struktur (ggf. überprüfen, ob noch benötigt oder durch structuredContractElements abgedeckt)
    structuredElements: v.optional(v.array( 
      v.object({
        id: v.string(), 
        type: v.string(), 
        content: v.string(),
        level: v.optional(v.number()), 
        parentId: v.optional(v.string())
      })
    )),
    createdAt: v.optional(v.number()), // Sollte v.number() sein, da Date.now() verwendet wird
    uploadedAt: v.optional(v.number()), // Sollte v.number() sein
    lastEditedAt: v.optional(v.number()), // Sollte v.number() sein

    // Felder für den Analyseprozess, basierend auf Fehlern hinzugefügt
    status: v.optional(contractStatus),         // z.B. "pending", "processing", "completed", "failed"
    totalChunks: v.optional(v.number()),       // Gesamtzahl der Chunks für die Analyse (Analyse-Chunks aus Stufe 2)
    processedChunks: v.optional(v.number()),   // Anzahl der bereits verarbeiteten Chunks
    analysisProtocol: v.optional(v.array(analysisProtocolEntry)), // Protokoll der Chunk-Analysen (Bezieht sich auf Stufe 3 Analyse-Chunks)
    
    // NEU: Details zum aktuellen Verarbeitungsschritt und Fehler
    currentProcessingStepDetail: v.optional(v.string()), // z.B. "Vor-Chunk 5/10 strukturiert"
    errorDetails: v.optional(v.string()), // Für detaillierte Fehlermeldungen während der Verarbeitung

    // Feld für von Benutzern bearbeitete Analysen/Klauseln
    editedAnalysis: v.optional(v.any()), // Typ v.any() als Platzhalter, spezifiziere dies genauer falls bekannt

  })
  // Index für Abfragen nach Benutzer-ID
  .index("by_userId", ["userId"]),

  // Tabelle für die Klauselanalyse
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
}); 