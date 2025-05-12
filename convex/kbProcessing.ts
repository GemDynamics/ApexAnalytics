"use strict";
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { fetchWithRetry } from "./utils/llmUtils"; // Annahme, dass llmUtils.ts existiert und fetchWithRetry exportiert

// Umgebungsvariable für den API-Key
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const EMBEDDING_MODEL = "text-embedding-004"; // Korrigiert: "models/" entfernt

// Hilfsfunktion zum Aufteilen eines Arrays in kleinere Batches
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export const getEmbeddings = action({
  args: {
    textsToEmbed: v.array(v.string()),
    taskType: v.optional(v.string()), // z.B. "RETRIEVAL_DOCUMENT"
  },
  handler: async (ctx, args) => {
    if (!GOOGLE_API_KEY) {
      throw new Error(
        "GOOGLE_API_KEY ist nicht in den Umgebungsvariablen im Convex Dashboard gesetzt."
      );
    }
    if (args.textsToEmbed.length === 0) {
      console.log("Keine Texte zum Embedden erhalten in getEmbeddings.");
      return [];
    }

    const embeddings = [];
    const textBatches = chunkArray(args.textsToEmbed, 100); // Google API Limit ist 100 Texte pro Request

    console.log(`getEmbeddings: Verarbeite ${args.textsToEmbed.length} Texte in ${textBatches.length} Batches...`);

    for (let i = 0; i < textBatches.length; i++) {
      const batch = textBatches[i];
      const requests = batch.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        task_type: args.taskType || "RETRIEVAL_DOCUMENT", 
      }));

      // Warnung für zu lange Texte (optional, aber hilfreich)
      for (const text of batch) {
        if (text.length > 3072 * 6) { // Google's Tokenizer: ca. 6 Zeichen pro Token, Limit 3072 Tokens
            console.warn(`getEmbeddings: Text könnte zu lang sein (>${3072*6} Zeichen) und wird ggf. abgeschnitten: "${text.substring(0,100)}..."`);
        }
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${GOOGLE_API_KEY}`;
      
      try {
        const response = await fetchWithRetry(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requests }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `Fehler von Google API (Batch ${i+1}/${textBatches.length}): ${response.status} ${response.statusText}`,
            errorBody
          );
          throw new Error(
            `Google API Fehler: ${response.status} - ${errorBody}`
          );
        }

        const responseData = await response.json();
        
        // Erweitertes Logging zur Überprüfung der Struktur
        console.log(`Batch ${i+1} Response Data (erste 5 Embeddings):`, JSON.stringify(responseData.embeddings?.slice(0,5), null, 2));

        if (responseData.embeddings && responseData.embeddings.length > 0) {
          const batchEmbeddings = responseData.embeddings.map((emb: any, index: number) => {
            if (emb && typeof emb.values !== 'undefined' && Array.isArray(emb.values)) {
              return emb.values;
            } else {
              // Logge das problematische Embedding-Objekt und den zugehörigen Text
              console.error(`Ungültiges oder fehlendes Embedding-Values-Array für Text-Index (im Batch) ${index} in Batch ${i+1}. Embedding-Objekt:`, JSON.stringify(emb, null, 2));
              console.error(`Zugehöriger Text (gekürzt): "${batch[index]?.substring(0, 100)}..."`);
              // Wir MÜSSEN hier etwas Gültiges zurückgeben oder den Fehler anders behandeln.
              // Option A: Fehler werfen (stoppt den Prozess)
              // throw new Error(`Ungültiges Embedding-Value von Google API für Text: ${batch[index]?.substring(0,30)}`);
              // Option B: Einen Dummy-Wert oder null zurückgeben und später filtern (wenn das Skript damit umgehen kann)
              // Für jetzt werfen wir einen Fehler, um das Problem sichtbar zu machen.
               throw new Error(`Ungültiges oder fehlendes Embedding-Values-Array von Google API empfangen für einen Text in Batch ${i+1}.`);
            }
          });
          embeddings.push(...batchEmbeddings);
        } else {
          console.warn(`Keine Embeddings im Response für Batch ${i+1} gefunden. Response:`, JSON.stringify(responseData, null, 2));
           // Wenn der gesamte Batch keine Embeddings liefert, müssen wir entscheiden, wie wir damit umgehen.
           // Für die Anzahl der Texte in diesem Batch könnten jetzt undefined Embeddings entstehen, wenn wir nicht aufpassen.
           // Eine Möglichkeit wäre, für jeden Text im Batch einen Fehler zu werfen oder null-artige Werte zu pushen.
           // Vorerst: Fehler werfen, wenn der responseData.embeddings leer ist, aber erwartet wurde.
           if (batch.length > 0) { // Nur Fehler werfen, wenn auch Texte im Batch waren
                throw new Error(`Google API lieferte keine Embeddings für Batch ${i+1}, obwohl Texte vorhanden waren.`);
           }
        }

      } catch (error) {
        console.error(`Fehler beim Abrufen der Embeddings für Batch ${i+1}/${textBatches.length}:`, error);
        // Entscheide, ob du hier abbrichst oder mit den nächsten Batches weitermachst
        // Fürs Erste brechen wir ab, wenn ein Batch fehlschlägt
        throw error; 
      }
      
      // Kleine Verzögerung zwischen den Batches, um Ratenlimits zu respektieren
      if (i < textBatches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 Sekunde Pause
      }
    }
    console.log(`getEmbeddings: Erfolgreich ${embeddings.length} Embeddings generiert.`);
    return embeddings;
  },
});


export const storeKnowledgeChunkBatch = mutation({
    args: {
        chunks: v.array(v.object({
            textContent: v.string(),
            metadata: v.any(), // oder ein spezifischeres v.object, wenn Metadaten Struktur bekannt ist
            embedding: v.array(v.float64())
        }))
    },
    handler: async (ctx, args) => {
        if (!args.chunks || args.chunks.length === 0) {
            console.log("storeKnowledgeChunkBatch: Keine Chunks zum Speichern erhalten.");
            return { storedCount: 0, storedIds: [] };
        }
        
        console.log(`storeKnowledgeChunkBatch: Speichere ${args.chunks.length} Chunks...`);
        const storedIds = [];
        for (const chunk of args.chunks) {
            try {
                const id = await ctx.db.insert("knowledgeChunks", { // Annahme: Tabelle heißt 'knowledgeChunks'
                    textContent: chunk.textContent,
                    metadata: chunk.metadata,
                    embedding: chunk.embedding,
                });
                storedIds.push(id);
            } catch (error) {
                console.error("Fehler beim Speichern eines Knowledge Chunks:", chunk.textContent.substring(0,50), error);
                // Optional: Fehler weiterwerfen oder nur loggen und weitermachen
            }
        }
        console.log(`storeKnowledgeChunkBatch: Erfolgreich ${storedIds.length} von ${args.chunks.length} Chunks gespeichert.`);
        return { storedCount: storedIds.length, storedIds: storedIds };
    }
});

// Die testAction ist jetzt entfernt.
// export const testAction = internalAction({
//   args: { name: v.string() },
//   handler: async (ctx, args) => {
//     console.log(`TestAction called with name: ${args.name}`);
//     return `Hello, ${args.name}! from testAction`;
//   },
// }); 