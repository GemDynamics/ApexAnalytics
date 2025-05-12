import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
// import { internal } from "./_generated/api"; // Nicht verwendet in dieser Datei nach Bereinigung
// import { api } from "./_generated/api"; // Nicht verwendet in dieser Datei nach Bereinigung

// Import einen Knowledge-Chunk in die Datenbank
// Auskommentiert, da für den initialen Bulk-Import storeKnowledgeChunkBatch aus knowledgeBase.ts verwendet wird.
// Eine Funktion zum Hinzufügen einzelner Chunks (z.B. via Admin UI) müsste das Embedding-Handling neu konzipieren.
/*
export const importKnowledgeChunk = mutation({
  args: {
    id: v.string(),
    textContent: v.string(),
    metadata: v.object({
      source: v.string(),
      type: v.string(),
      keywords: v.array(v.string()),
      last_updated: v.string()
    }),
    embedding: v.array(v.float64())
  },
  handler: async (ctx, args) => {
    // Prüfen, ob der Chunk bereits existiert
    const existingChunks = await ctx.db
      .query("knowledgeChunks")
      .filter(q => q.eq(q.field("id"), args.id))
      .collect();

    if (existingChunks.length > 0) {
      // Chunk aktualisieren
      return ctx.db.patch(existingChunks[0]._id, {
        textContent: args.textContent,
        metadata: args.metadata,
        embedding: args.embedding
      });
    } else {
      // Neuen Chunk erstellen
      return ctx.db.insert("knowledgeChunks", {
        id: args.id,
        textContent: args.textContent,
        metadata: args.metadata,
        embedding: args.embedding
      });
    }
  }
});
*/

// Wissens-Chunks basierend auf Ähnlichkeit zum Eingabetext finden
export const findSimilarChunks = query({
  args: {
    inputEmbedding: v.array(v.float64()),
    limit: v.optional(v.number()),
    // threshold: v.optional(v.number()) // Threshold wird besser serverseitig in der Vektorsuch-Query gehandhabt
  },
  handler: async (ctx, args) => {
    // Standardwerte für Limit
    const limit = args.limit || 5;
    // const threshold = args.threshold || 0.75; // Siehe Kommentar oben

    // TODO: Implement actual vector search using ctx.db.vectorSearch(...)
    // Die aktuelle Implementierung ist ein Platzhalter und funktioniert nicht korrekt.
    /*
    const similarChunks = await ctx.db
      .query("knowledgeChunks")
      // Verwende die Vektor-Such-Methode entsprechend der Convex-Dokumentation
      // Dies ist ein Platzhalter und muss an die tatsächliche API angepasst werden
      .collect();

    // In einer realen Implementation würde hier die Vektor-Suche verwendet
    // Für jetzt simulieren wir einfach eine Ähnlichkeitsberechnung
    const results = similarChunks.map(chunk => ({
      ...chunk,
      // Hier würde normalerweise ein Score basierend auf der Vektorähnlichkeit berechnet
      score: 0.8 // Dummy-Wert für die Demonstration
    }));

    // Nur Chunks über dem Schwellenwert zurückgeben
    return results.filter(chunk => chunk.score >= threshold);
    */
    console.warn("findSimilarChunks: Implementierung der Vektorsuche ist noch ausstehend. Gebe leeres Array zurück.");
    return []; // Platzhalter-Rückgabe
  }
});

// Hilfsfunktion, um Einbettungen für einen Text zu erzeugen - ENTFERNT, da getEmbeddings in knowledgeBase.ts existiert
/*
export const createTextEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // In einer echten Implementierung würden wir die Gemini-Action aufrufen
    // Für dieses Beispiel geben wir ein Dummy-Array in der Größe von Gemini-Embeddings zurück
    return new Array(768).fill(0);
  }
});
*/

// Alle Analyse-Regeln abrufen
export const getAnalysisRules = query({
  handler: async (ctx) => {
    const rules = await ctx.db.query("analysisRules").collect();
    
    // Nach Typ gruppieren
    // TODO: Überprüfen, ob chunkIds sich auf die alte string ID oder die neue Convex _id bezieht.
    // Falls auf alte ID, muss dies angepasst werden oder die analysisRules-Tabelle neu befüllt/überdacht werden.
    const redFlags = rules.filter(rule => rule.type === "red_flag").flatMap(rule => rule.chunkIds);
    const yellowFlags = rules.filter(rule => rule.type === "yellow_flag").flatMap(rule => rule.chunkIds);
    const greenPatterns = rules.filter(rule => rule.type === "green_pattern").flatMap(rule => rule.chunkIds);

    return {
      redFlags,
      yellowFlags,
      greenPatterns
    };
  }
});

// Analyse-Regeln speichern
export const saveAnalysisRules = mutation({
  args: {
    type: v.string(),
    chunkIds: v.array(v.string()) // TODO: Siehe Kommentar bei getAnalysisRules bezüglich chunkIds
  },
  handler: async (ctx, args) => {
    // Bestehende Regeln für diesen Typ finden
    const existingRules = await ctx.db
      .query("analysisRules")
      .filter(q => q.eq(q.field("type"), args.type))
      .collect();

    if (existingRules.length > 0) {
      // Regeln aktualisieren
      return ctx.db.patch(existingRules[0]._id, {
        chunkIds: args.chunkIds
      });
    } else {
      // Neue Regeln erstellen
      return ctx.db.insert("analysisRules", {
        type: args.type,
        chunkIds: args.chunkIds
      });
    }
  }
});

// Alle Wissens-Chunks nach Typ abrufen
export const getKnowledgeChunksByType = query({
  args: {
    type: v.string()
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("knowledgeChunks")
      .filter(q => q.eq(q.field("metadata.type"), args.type))
      .collect();
  }
});

// Einen spezifischen Wissens-Chunk nach seiner Convex _id abrufen
export const getKnowledgeChunkById = query({
  args: {
    knowledgeChunkId: v.id("knowledgeChunks") // Argument ist jetzt eine Convex ID
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.knowledgeChunkId); // Direkter Zugriff über .get()
  }
}); 